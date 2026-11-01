import { describe, it, expect } from 'vitest';
import { cloneConfig, configsEqual, resolveConfigChange } from '../../src/view/configSync.js';

const baseConfig = () => ({
  activeProfile: 'profile1',
  profiles: {
    profile1: { name: 'Satu', skrining: { answers: { answer8AA: 'A' } } },
    profile2: { name: 'Dua' },
  },
});

describe('configSync', () => {
  describe('cloneConfig', () => {
    it('should deep-copy nested values', () => {
      const original = baseConfig();
      const copy = cloneConfig(original);

      copy.profiles.profile1.skrining.answers.answer8AA = 'B';
      copy.profiles.profile2.name = 'Berubah';

      expect(original.profiles.profile1.skrining.answers.answer8AA).toBe('A');
      expect(original.profiles.profile2.name).toBe('Dua');
    });
  });

  describe('configsEqual', () => {
    it('should treat structurally equal objects as equal', () => {
      expect(configsEqual(baseConfig(), baseConfig())).toBe(true);
    });

    it('should ignore key order', () => {
      const left = { a: 1, b: { c: 2, d: 3 } };
      const right = { b: { d: 3, c: 2 }, a: 1 };

      expect(configsEqual(left, right)).toBe(true);
    });

    it('should detect a changed nested value', () => {
      const left = baseConfig();
      const right = baseConfig();
      right.profiles.profile1.skrining.answers.answer8AA = 'B';

      expect(configsEqual(left, right)).toBe(false);
    });

    it('should distinguish arrays, missing keys and null', () => {
      expect(configsEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
      expect(configsEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(configsEqual(null, {})).toBe(false);
    });
  });

  describe('resolveConfigChange', () => {
    it('should apply when the editor is clean', () => {
      expect(
        resolveConfigChange({ dirty: false, local: baseConfig(), incoming: baseConfig() }),
      ).toBe('apply');
    });

    it('should apply an incoming change when nothing is being edited', () => {
      const incoming = baseConfig();
      incoming.profiles.profile1.name = 'Baru';

      expect(resolveConfigChange({ dirty: false, local: baseConfig(), incoming })).toBe('apply');
    });

    it('should ignore the echo of its own save while the editor is dirty', () => {
      const local = baseConfig();
      local.profiles.profile1.name = 'Lokal';

      expect(resolveConfigChange({ dirty: true, local, incoming: cloneConfig(local) })).toBe(
        'ignore',
      );
    });

    it('should flag a conflict when storage moved under a dirty editor', () => {
      const local = baseConfig();
      local.profiles.profile1.name = 'Lokal';
      const incoming = baseConfig();
      incoming.profiles.profile1.name = 'Tab lain';

      expect(resolveConfigChange({ dirty: true, local, incoming })).toBe('conflict');
    });
  });
});
