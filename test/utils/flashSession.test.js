import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';
import { setFlashData, getFlashData, clearFlashData } from '../../src/utils/flashSession.js';

describe('flashSession', () => {
  beforeEach(() => {
    store.init(new MemoryBackend());
  });

  it('getFlashData should return null when no data', async () => {
    expect(await getFlashData()).toBeNull();
  });

  it('setFlashData should store data with timestamp', async () => {
    await setFlashData({ pinneds: { key: 'val' } });
    const data = await getFlashData();
    expect(data.pinneds).toEqual({ key: 'val' });
    expect(data).toHaveProperty('_timestamp');
  });

  it('getFlashData should return null for expired data', async () => {
    await setFlashData({ pinneds: { key: 'val' } });
    const result = await getFlashData(-1);
    expect(result).toBeNull();
  });

  it('clearFlashData should remove stored data', async () => {
    await setFlashData({ pinneds: { key: 'val' } });
    await clearFlashData();
    expect(await getFlashData()).toBeNull();
  });

  it('getFlashData with custom maxAge should respect expiry', async () => {
    await setFlashData({ pinneds: {} });
    const result = await getFlashData(1000);
    expect(result).not.toBeNull();
  });

  describe('error handling', () => {
    it('setFlashData should handle empty object', async () => {
      await setFlashData({});
      const data = await getFlashData();
      expect(data).not.toBeNull();
      expect(data).toHaveProperty('_timestamp');
    });

    it('getFlashData with zero maxAge should expire immediately', async () => {
      await setFlashData({ test: 'data' });
      const result = await getFlashData(-1);
      expect(result).toBeNull();
    });

    it('getFlashData with negative maxAge should return null', async () => {
      await setFlashData({ test: 'data' });
      const result = await getFlashData(-999);
      expect(result).toBeNull();
    });

    it('should handle consecutive set operations', async () => {
      await setFlashData({ data: '1' });
      await setFlashData({ data: '2' });
      const result = await getFlashData();
      expect(result.data).toBe('2');
    });

    it('should handle very large data objects', async () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: 'x'.repeat(100) })),
      };
      await setFlashData(largeData);
      const result = await getFlashData(5000);
      expect(result).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should preserve nested object structure', async () => {
      const nested = { level1: { level2: { level3: 'value' } } };
      await setFlashData(nested);
      const result = await getFlashData();
      expect(result.level1.level2.level3).toBe('value');
    });

    it('should handle arrays in data', async () => {
      await setFlashData({ arr: [1, 2, 3, 4, 5] });
      const result = await getFlashData();
      expect(result.arr).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle null values in data', async () => {
      await setFlashData({ nullable: null, other: 'value' });
      const result = await getFlashData();
      expect(result.nullable).toBeNull();
      expect(result.other).toBe('value');
    });

    it('clearFlashData followed by getFlashData should return null', async () => {
      await setFlashData({ test: 'data' });
      await clearFlashData();
      const result = await getFlashData();
      expect(result).toBeNull();
    });

    it('multiple clearFlashData calls should be idempotent', async () => {
      await setFlashData({ test: 'data' });
      await clearFlashData();
      await clearFlashData();
      expect(await getFlashData()).toBeNull();
    });
  });
});
