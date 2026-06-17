import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/quota/verify.js', () => ({
  verifyLicense: vi.fn(),
}));

import { store } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';
import { verifyLicense } from '../../src/quota/verify.js';
import {
  init,
  getStatus,
  getDeviceId,
  isFeatureEnabled,
  getDailyCap,
  getRemainingToday,
  isLimitReached,
  canUseTokens,
  removeToken,
  saveToken,
  getToken,
} from '../../src/quota/quota-manager.js';

describe('quota-manager', () => {
  beforeEach(() => {
    store.init(new MemoryBackend());
    vi.clearAllMocks();
  });

  describe('status before init', () => {
    it('getStatus should return free plan defaults', () => {
      const s = getStatus();
      expect(s.status).toBe('none');
      expect(s.isFreePlan).toBe(true);
      expect(s.payload).toBeNull();
    });

    it('getDeviceId should return null', () => {
      expect(getDeviceId()).toBeNull();
    });
  });

  describe('init with empty store', () => {
    beforeEach(async () => {
      await init();
    });

    it('should set status to none (free plan)', () => {
      const s = getStatus();
      expect(s.status).toBe('none');
      expect(s.isFreePlan).toBe(true);
    });

    it('should create a device ID', () => {
      expect(getDeviceId()).toBeTruthy();
      expect(getDeviceId().length).toBe(8);
    });

    it('isFeatureEnabled should return true for any feature', () => {
      expect(isFeatureEnabled('any-feature')).toBe(true);
    });

    it('getDailyCap should return 50 for free plan', () => {
      expect(getDailyCap()).toBe(50);
    });

    it('getRemainingToday should return 50 when no usage', async () => {
      expect(await getRemainingToday()).toBe(50);
    });

    it('isLimitReached should return false', async () => {
      expect(await isLimitReached()).toBe(false);
    });

    it('canUseTokens should allow usage within free limit', async () => {
      const result = await canUseTokens({ radio: 1, dropdown: 1 });
      expect(result.canUse).toBe(true);
    });

    it('canUseTokens should reject when over free limit', async () => {
      const result = await canUseTokens({ formNotChecked: 11 });
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('Free limit reached');
    });
  });

  describe('init with valid cache', () => {
    beforeEach(async () => {
      await store.setCache({
        status: 'valid',
        payload: { total_limit: 50_000, features: ['premium'] },
      });
      await init();
    });

    it('should load state from cache', () => {
      const s = getStatus();
      expect(s.status).toBe('valid');
      expect(s.isFreePlan).toBe(false);
      // oxlint-disable-next-line unicorn/numeric-separators-style
      expect(s.payload.total_limit).toBe(50000);
    });

    it('isFeatureEnabled should check cache payload', () => {
      expect(isFeatureEnabled('premium')).toBe(true);
      expect(isFeatureEnabled('nonexistent')).toBe(false);
    });
  });

  describe('init with valid JWT', () => {
    beforeEach(async () => {
      await store.setDeviceId('test-device');
      await store.saveQuotaToken('valid-jwt');
      verifyLicense.mockResolvedValue({
        license_id: 'test-device',
        features: ['skrining-send'],
        // oxlint-disable-next-line unicorn/numeric-separators-style
        total_limit: 200000,
        daily_limit: 200,
        version_allowed: ['*'],
      });
      await init();
    });

    it('should set status to valid', () => {
      const s = getStatus();
      expect(s.status).toBe('valid');
      expect(s.isFreePlan).toBe(false);
    });

    it('should store license payload', () => {
      const s = getStatus();
      // oxlint-disable-next-line unicorn/numeric-separators-style
      expect(s.payload.total_limit).toBe(200000);
      expect(s.payload.features).toContain('skrining-send');
    });

    it('isFeatureEnabled should check payload features', () => {
      expect(isFeatureEnabled('skrining-send')).toBe(true);
      expect(isFeatureEnabled('other')).toBe(false);
    });
  });

  describe('init with invalid JWT', () => {
    beforeEach(async () => {
      await store.saveQuotaToken('expired-jwt');
      verifyLicense.mockResolvedValue(null);
      await init();
    });

    it('should fall back to free plan', () => {
      const s = getStatus();
      expect(s.status).toBe('none');
      expect(s.isFreePlan).toBe(true);
    });
  });

  describe('init with version mismatch', () => {
    beforeEach(async () => {
      await store.setDeviceId('test-device');
      await store.saveQuotaToken('wrong-version-jwt');
      verifyLicense.mockResolvedValue({
        license_id: 'test-device',
        features: [],
        total_limit: 0,
        daily_limit: 0,
        version_allowed: ['999.0.0'],
      });
      await init();
    });

    it('should fall back to free plan on version mismatch', () => {
      const s = getStatus();
      expect(s.status).toBe('none');
      expect(s.isFreePlan).toBe(true);
    });
  });

  describe('token management', () => {
    it('getToken should return null initially', async () => {
      expect(await getToken()).toBeNull();
    });

    it('saveToken should save and init with valid license', async () => {
      await store.setDeviceId('test-device');
      verifyLicense.mockResolvedValue({
        license_id: 'test-device',
        features: ['premium'],
        // oxlint-disable-next-line unicorn/numeric-separators-style
        total_limit: 100000,
        daily_limit: 100,
        version_allowed: ['*'],
      });
      await saveToken('new-license-jwt');
      expect(await getToken()).toBe('new-license-jwt');
      const s = getStatus();
      expect(s.status).toBe('valid');
    });

    it('saveToken should throw for invalid token string', async () => {
      await expect(saveToken('')).rejects.toThrow('Invalid token string');
      await expect(saveToken('   ')).rejects.toThrow('Invalid token string');
    });

    it('saveToken should throw when verifyLicense returns null', async () => {
      await store.setDeviceId('test-device');
      verifyLicense.mockResolvedValue(null);
      await expect(saveToken('bad-token')).rejects.toThrow('Token tidak valid');
    });

    it('removeToken should reset to free plan', async () => {
      await store.saveQuotaToken('some-token');
      await removeToken();
      expect(await getToken()).toBeNull();
      const s = getStatus();
      expect(s.status).toBe('none');
      expect(s.isFreePlan).toBe(true);
    });
  });

  describe('canUseTokens with valid license', () => {
    beforeEach(async () => {
      await store.setDeviceId('test-device');
      await store.saveQuotaToken('fake-jwt');
      verifyLicense.mockResolvedValue({
        license_id: 'test-device',
        features: [],
        // oxlint-disable-next-line unicorn/numeric-separators-style
        total_limit: 1000,
        daily_limit: 100,
        version_allowed: ['*'],
      });
      await init();
    });

    it('should allow usage under total limit', async () => {
      const result = await canUseTokens({ radio: 10 });
      expect(result.canUse).toBe(true);
    });

    it('should fall back to grace limit when total exceeded', async () => {
      // total_limit=1000, weighted 1001 > 1000 → enters grace
      // daily_limit=100, 1001 > 100 → grace limit reached
      const result = await canUseTokens({ radio: 1001 });
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('Grace limit reached');
    });
  });
});
