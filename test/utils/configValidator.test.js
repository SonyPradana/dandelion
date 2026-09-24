import { describe, it, expect } from 'vitest';
import { parseConfig, validateConfig } from '../../src/utils/configValidator.js';

const validConfig = {
  activeProfile: 'profile1',
  panelPosition: 'top-right',
  silenceInfoNotification: false,
  profiles: {
    profile1: {
      name: 'Profile 1',
      formSkrining: {
        url: 'https://example.com/skrining',
        scrollToButton: true,
        radioButtonKeywords: 'ya;tidak',
        dropdownKeywords: 'pilih',
        excludes: 'x',
        respectInput: false,
        ensureFill: false,
      },
      notChecked: {
        url: 'https://example.com/not-checked',
        notCheckedList: 'a;b',
        automationDelay: 2000,
        itemDelay: 1000,
        reloadDelay: 1000,
        domTimeout: 5000,
      },
      registerForm: {
        url: 'https://example.com/register',
        retryMax: 3,
        retryDelay: 2000,
        countdownDuration: 5000,
      },
      skrining: { url: 'https://example.com/skrining' },
      zenMode: { domTimeout: 5000, enabled: false, timeout: 5000 },
      flashData: { enabled: false, maxAge: 600_000 },
    },
  },
};

describe('parseConfig', () => {
  it('should parse valid JSON object', () => {
    const result = parseConfig(JSON.stringify(validConfig));
    expect(result.ok).toBe(true);
    expect(result.value.activeProfile).toBe('profile1');
  });

  it('should reject invalid JSON', () => {
    const result = parseConfig('{ nope');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('JSON tidak valid');
  });

  it('should reject non-object JSON', () => {
    expect(parseConfig('null').ok).toBe(false);
    expect(parseConfig('[]').ok).toBe(false);
    expect(parseConfig('"str"').ok).toBe(false);
    expect(parseConfig('42').ok).toBe(false);
  });
});

describe('validateConfig', () => {
  it('should accept a valid config', () => {
    const result = validateConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject non-object input', () => {
    expect(validateConfig(null).valid).toBe(false);
    expect(validateConfig([]).valid).toBe(false);
    expect(validateConfig(undefined).valid).toBe(false);
  });

  it('should require non-empty profiles object', () => {
    const missingProfiles = { activeProfile: 'profile1' };
    expect(validateConfig(missingProfiles).errors[0]).toContain('profiles');

    const emptyProfiles = { ...validConfig, profiles: {} };
    expect(validateConfig(emptyProfiles).errors[0]).toContain('profiles');
  });

  it('should require activeProfile to exist as a profiles key', () => {
    const missingActive = { ...validConfig, activeProfile: undefined };
    const missingKey = { ...validConfig, activeProfile: 'ghost' };
    expect(validateConfig(missingActive).errors.some((e) => e.includes('activeProfile'))).toBe(
      true,
    );
    expect(
      validateConfig(missingKey).errors.some((e) => e.includes('ghost') && e.includes('profiles')),
    ).toBe(true);
  });

  it('should flag non-string url fields', () => {
    const bad = structuredClone(validConfig);
    bad.profiles.profile1.formSkrining.url = 123;
    const result = validateConfig(bad);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('formSkrining.url');
    expect(result.errors[0]).toContain('teks');
  });

  it('should flag non-number delay fields', () => {
    const bad = structuredClone(validConfig);
    bad.profiles.profile1.notChecked.automationDelay = '2000';
    const result = validateConfig(bad);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('automationDelay');
    expect(result.errors[0]).toContain('angka');
  });

  it('should flag negative delay values', () => {
    const bad = structuredClone(validConfig);
    bad.profiles.profile1.registerForm.retryMax = -1;
    const result = validateConfig(bad);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('retryMax');
  });

  it('should flag non-boolean flags', () => {
    const bad = structuredClone(validConfig);
    bad.profiles.profile1.zenMode.enabled = 'yes';
    bad.silenceInfoNotification = 'no';
    const result = validateConfig(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('zenMode.enabled'))).toBe(true);
    expect(result.errors.some((e) => e.includes('silenceInfoNotification'))).toBe(true);
  });

  it('should collect multiple profile errors', () => {
    const bad = structuredClone(validConfig);
    bad.profiles.profile1.formSkrining.url = 1;
    bad.profiles.profile1.notChecked.itemDelay = 'x';
    const result = validateConfig(bad);
    expect(result.errors.length).toBe(2);
  });

  it('should reject inherited profile keys via activeProfile', () => {
    const bad = { activeProfile: 'toString', profiles: { profile1: {} } };
    const result = validateConfig(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('toString') && e.includes('profiles'))).toBe(true);
  });

  it('should reject unsupported panelPosition values', () => {
    const badQuote = { ...validConfig, panelPosition: '"' };
    const badMiddle = { ...validConfig, panelPosition: 'middle' };
    expect(validateConfig(badQuote).valid).toBe(false);
    expect(validateConfig(badMiddle).valid).toBe(false);
  });

  it('should accept all supported panelPosition values', () => {
    for (const pos of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
      const result = validateConfig({ ...validConfig, panelPosition: pos });
      expect(result.valid).toBe(true);
    }
  });

  it('should reject unknown top-level keys', () => {
    const bad = { ...validConfig, dandelion_terms: { agreed: true } };
    const result = validateConfig(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('dandelion_terms'))).toBe(true);
  });

  it('should reject profiles missing required sections', () => {
    const bad = structuredClone(validConfig);
    delete bad.profiles.profile1.zenMode;
    const result = validateConfig(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('zenMode'))).toBe(true);
  });

  it('should reject null required sections', () => {
    const bad = structuredClone(validConfig);
    bad.profiles.profile1.formSkrining = null;
    const result = validateConfig(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('formSkrining'))).toBe(true);
  });
});
