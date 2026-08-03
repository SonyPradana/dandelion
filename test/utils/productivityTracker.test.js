import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';
import {
  increment,
  incrementBatch,
  getTodaySummary,
  getYesterdaySummary,
  getDaySummary,
  getRange,
  getMonthTotal,
  getWeekTotal,
  getOverallBreakdown,
  getFullHistory,
  isDailyLimitReached,
  validateChain,
  migrateWeights,
  WEIGHTS,
  MONTHLY_TARGET,
  TARGET_MODE,
  DAILY_LIMIT,
} from '../../src/utils/productivityTracker.js';

describe('productivityTracker', () => {
  beforeEach(() => {
    store.init(new MemoryBackend());
  });

  describe('constants', () => {
    it('should have correct WEIGHTS', () => {
      expect(WEIGHTS).toEqual({
        radio: 1,
        freetext: 1,
        dropdown: 1,
        formNotChecked: 5,
        formZen: 5,
        registerForm: 25,
      });
    });

    it('should have MONTHLY_TARGET', () => {
      // oxlint-disable-next-line unicorn/numeric-separators-style
      expect(MONTHLY_TARGET).toBe(30_000);
    });

    it('should have TARGET_MODE', () => {
      expect(TARGET_MODE).toBe('weekly');
    });

    it('should have DAILY_LIMIT', () => {
      // oxlint-disable-next-line unicorn/numeric-separators-style
      expect(DAILY_LIMIT).toBe(13_200);
    });
  });

  it('getTodaySummary should return null when no data', async () => {
    expect(await getTodaySummary()).toBeNull();
  });

  it('getYesterdaySummary should return null when no data', async () => {
    expect(await getYesterdaySummary()).toBeNull();
  });

  it('incrementBatch should accumulate counts', async () => {
    await incrementBatch({ radio: 2, dropdown: 1 });
    const summary = await getTodaySummary();
    expect(summary.counts.radio).toBe(2);
    expect(summary.counts.dropdown).toBe(1);
    expect(summary.dayTotal).toBe(3);
  });

  it('increment should add to a single category', async () => {
    await increment('formZen');
    const summary = await getTodaySummary();
    expect(summary.counts.formZen).toBe(1);
  });

  it('increment should warn for unknown category', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await increment('unknown');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('getFullHistory should return raw data', async () => {
    await incrementBatch({ radio: 1 });
    const history = await getFullHistory();
    expect(history).toHaveProperty('_meta');
  });

  it('isDailyLimitReached should return false below limit', async () => {
    expect(await isDailyLimitReached()).toBe(false);
  });

  it('getOverallBreakdown should aggregate data', async () => {
    await incrementBatch({ radio: 5 });
    const breakdown = await getOverallBreakdown();
    expect(breakdown.counts.radio).toBe(5);
    expect(breakdown.grandTotal).toBeGreaterThan(0);
    expect(breakdown.activeDays).toBeGreaterThan(0);
  });

  describe('weight calculations', () => {
    it('formNotChecked should weight 5x', async () => {
      await incrementBatch({ formNotChecked: 1 });
      const summary = await getTodaySummary();
      expect(summary.dayTotal).toBe(5);
    });

    it('formZen should weight 5x', async () => {
      await incrementBatch({ formZen: 1 });
      const summary = await getTodaySummary();
      expect(summary.dayTotal).toBe(5);
    });
  });

  describe('getMonthTotal', () => {
    it('should sum day totals for current month', async () => {
      await incrementBatch({ radio: 10 });
      const total = await getMonthTotal();
      expect(total).toBe(10);
    });
  });

  describe('getWeekTotal', () => {
    it('should sum day totals for current week', async () => {
      await incrementBatch({ radio: 10 });
      const total = await getWeekTotal();
      expect(total).toBe(10);
    });
  });

  describe('getDaySummary', () => {
    it('should return null for empty date', async () => {
      const result = await getDaySummary('2025-01-01');
      expect(result).toBeNull();
    });

    it('should return today data when exists', async () => {
      await incrementBatch({ radio: 5, dropdown: 2 });
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const result = await getDaySummary(dateKey);
      expect(result).not.toBeNull();
      expect(result.counts.radio).toBe(5);
      expect(result.counts.dropdown).toBe(2);
      expect(result.dayTotal).toBe(7);
    });

    it('should return null for future date (no data)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      const result = await getDaySummary(dateKey);
      expect(result).toBeNull();
    });

    it('should include all category counts in returned object', async () => {
      await incrementBatch({ radio: 1, freetext: 2 });
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const result = await getDaySummary(dateKey);
      expect(result.counts).toHaveProperty('radio');
      expect(result.counts).toHaveProperty('freetext');
      expect(result.counts).toHaveProperty('dropdown');
      expect(result.counts).toHaveProperty('formNotChecked');
      expect(result.counts).toHaveProperty('formZen');
      expect(result.counts).toHaveProperty('registerForm');
    });
  });

  describe('getRange', () => {
    it('should return single day range', async () => {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await incrementBatch({ radio: 5 });
      const result = await getRange(dateKey, dateKey);
      expect(result).toHaveLength(1);
      expect(result[0].dayTotal).toBe(5);
    });

    it('should return 2-day range correctly', async () => {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await incrementBatch({ radio: 3 });
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      const result = await getRange(dateKey, tomorrowKey);
      expect(result).toHaveLength(2);
      expect(result[0].dayTotal).toBe(3);
      expect(result[1]).toBeNull();
    });

    it('should handle week-long range', async () => {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await incrementBatch({ radio: 1 });
      const weekLater = new Date(today);
      weekLater.setDate(weekLater.getDate() + 6);
      const weekKey = `${weekLater.getFullYear()}-${String(weekLater.getMonth() + 1).padStart(2, '0')}-${String(weekLater.getDate()).padStart(2, '0')}`;
      const result = await getRange(dateKey, weekKey);
      expect(result).toHaveLength(7);
      expect(result[0].dayTotal).toBe(1);
    });

    it('should include nulls for dates with no data', async () => {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 2);
      const threeKey = `${threeDaysLater.getFullYear()}-${String(threeDaysLater.getMonth() + 1).padStart(2, '0')}-${String(threeDaysLater.getDate()).padStart(2, '0')}`;
      const result = await getRange(dateKey, threeKey);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((r) => r === null)).toBe(true);
    });
  });

  describe('isDailyLimitReached - boundary cases', () => {
    it('should return false when exactly below limit', async () => {
      const belowLimit = DAILY_LIMIT - 1;
      const itemsNeeded = Math.ceil(belowLimit / 5);
      await incrementBatch({ formZen: itemsNeeded - 1 });
      expect(await isDailyLimitReached()).toBe(false);
    });

    it('should return true when exactly at limit', async () => {
      const itemsNeeded = Math.ceil(DAILY_LIMIT / 5);
      await incrementBatch({ formZen: itemsNeeded });
      expect(await isDailyLimitReached()).toBe(true);
    });

    it('should return true when above limit', async () => {
      const itemsNeeded = Math.ceil(DAILY_LIMIT / 5) + 10;
      await incrementBatch({ formZen: itemsNeeded });
      expect(await isDailyLimitReached()).toBe(true);
    });

    it('should return false with mixed weights below limit', async () => {
      await incrementBatch({ radio: 100, formZen: 500 });
      const today = await getTodaySummary();
      if (today.dayTotal < DAILY_LIMIT) {
        expect(await isDailyLimitReached()).toBe(false);
      }
    });
  });

  describe('validateChain', () => {
    it('should return valid state for empty data', async () => {
      const result = await validateChain();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalChecked).toBe(0);
      expect(result.mismatches).toBe(0);
    });

    it('should detect valid chain after incrementBatch', async () => {
      await incrementBatch({ radio: 5, formZen: 2 });
      const result = await validateChain();
      expect(result.valid).toBe(true);
      expect(result.mismatches).toBe(0);
      expect(result.totalChecked).toBeGreaterThan(0);
    });

    it('should return proper structure', async () => {
      await incrementBatch({ radio: 1 });
      const result = await validateChain();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('totalChecked');
      expect(result).toHaveProperty('mismatches');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should have totalChecked > 0 when data exists', async () => {
      await incrementBatch({ radio: 3, dropdown: 2 });
      const result = await validateChain();
      expect(result.totalChecked).toBeGreaterThan(0);
    });
  });

  describe('migrateWeights', () => {
    it('should complete without error', async () => {
      await incrementBatch({ radio: 5 });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await expect(migrateWeights()).resolves.toBeUndefined();
      spy.mockRestore();
    });

    it('should preserve data after migration', async () => {
      await incrementBatch({ radio: 5, formZen: 1 });
      const beforeMigrate = await getTodaySummary();
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await migrateWeights();
      spy.mockRestore();
      const afterMigrate = await getTodaySummary();
      expect(afterMigrate.dayTotal).toBe(beforeMigrate.dayTotal);
      expect(afterMigrate.counts.radio).toBe(beforeMigrate.counts.radio);
      expect(afterMigrate.counts.formZen).toBe(beforeMigrate.counts.formZen);
    });

    it('should log migration message', async () => {
      await incrementBatch({ radio: 2 });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await migrateWeights();
      expect(spy).toHaveBeenCalled();
      const calls = spy.mock.calls.map((c) => c[0]);
      expect(calls.some((c) => typeof c === 'string' && c.includes('Migrate'))).toBe(true);
      spy.mockRestore();
    });

    it('should update _meta after migration', async () => {
      await incrementBatch({ radio: 1 });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await migrateWeights();
      const history = await getFullHistory();
      expect(history._meta).toBeDefined();
      expect(history._meta.weights).toBeDefined();
      spy.mockRestore();
    });
  });

  describe('error handling - edge cases', () => {
    it('increment should handle negative values gracefully', async () => {
      await incrementBatch({ radio: -5 });
      const summary = await getTodaySummary();
      expect(summary.dayTotal).toBe(0);
    });

    it('increment should skip 0 values', async () => {
      await incrementBatch({ radio: 0 });
      const summary = await getTodaySummary();
      expect(summary.dayTotal).toBe(0);
    });

    it('incrementBatch should ignore unknown categories', async () => {
      const originalWarn = console.warn;
      console.warn = vi.fn();
      await incrementBatch({ unknown: 100, radio: 5 });
      const summary = await getTodaySummary();
      expect(summary.counts.radio).toBe(5);
      console.warn = originalWarn;
    });

    it('getRange should handle same-day range', async () => {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const result = await getRange(dateKey, dateKey);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should maintain grandTotal chain integrity after multiple operations', async () => {
      await incrementBatch({ radio: 10 });
      await incrementBatch({ radio: 5 });
      const today = await getTodaySummary();
      expect(today.dayTotal).toBe(15);
      const result = await validateChain();
      expect(result.valid).toBe(true);
    });
  });
});
