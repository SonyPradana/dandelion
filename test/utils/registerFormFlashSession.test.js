import { describe, it, expect, beforeEach } from 'vitest';
import { store, DandelionStore } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';
import {
  setRegisterFormFlashData,
  getRegisterFormFlashData,
  clearRegisterFormFlashData,
} from '../../src/utils/registerFormFlashSession.js';

describe('registerFormFlashSession', () => {
  beforeEach(() => {
    store.init(new MemoryBackend());
  });

  it('getRegisterFormFlashData should return null when no data', async () => {
    expect(await getRegisterFormFlashData()).toBeNull();
  });

  it('setRegisterFormFlashData should store data with timestamp', async () => {
    await setRegisterFormFlashData({ nik: '123', nama: 'Foo' });
    const data = await getRegisterFormFlashData();
    expect(data.nik).toBe('123');
    expect(data.nama).toBe('Foo');
    expect(data).toHaveProperty('_timestamp');
  });

  it('getRegisterFormFlashData should return null for expired data', async () => {
    await setRegisterFormFlashData({ nik: '123' });
    const result = await getRegisterFormFlashData(-1);
    expect(result).toBeNull();
  });

  it('clearRegisterFormFlashData should remove stored data', async () => {
    await setRegisterFormFlashData({ nik: '123' });
    await clearRegisterFormFlashData();
    expect(await getRegisterFormFlashData()).toBeNull();
  });

  it('getRegisterFormFlashData with custom maxAge should respect expiry', async () => {
    await setRegisterFormFlashData({ nik: '123' });
    const result = await getRegisterFormFlashData(1000);
    expect(result).not.toBeNull();
  });

  it('expired data should be cleared from the injected store', async () => {
    const otherBackend = new MemoryBackend();
    const otherStore = new DandelionStore();
    otherStore.init(otherBackend);

    await otherStore.storageSet('flash_data_register_form', {
      nik: '123',
      _timestamp: Date.now() - 1_000_000,
    });

    await getRegisterFormFlashData(0, otherStore);

    expect(await otherStore.storageGet('flash_data_register_form')).toBeNull();
    expect(await store.storageGet('flash_data_register_form')).toBeNull();
  });

  describe('error handling', () => {
    it('setRegisterFormFlashData should handle empty object', async () => {
      await setRegisterFormFlashData({});
      const data = await getRegisterFormFlashData();
      expect(data).not.toBeNull();
      expect(data).toHaveProperty('_timestamp');
    });

    it('getRegisterFormFlashData with zero maxAge should expire immediately', async () => {
      await setRegisterFormFlashData({ test: 'data' });
      const result = await getRegisterFormFlashData(-1);
      expect(result).toBeNull();
    });

    it('getRegisterFormFlashData with negative maxAge should return null', async () => {
      await setRegisterFormFlashData({ test: 'data' });
      const result = await getRegisterFormFlashData(-999);
      expect(result).toBeNull();
    });

    it('should handle consecutive set operations', async () => {
      await setRegisterFormFlashData({ data: '1' });
      await setRegisterFormFlashData({ data: '2' });
      const result = await getRegisterFormFlashData();
      expect(result.data).toBe('2');
    });

    it('should handle very large data objects', async () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: 'x'.repeat(100) })),
      };
      await setRegisterFormFlashData(largeData);
      const result = await getRegisterFormFlashData(5000);
      expect(result).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should preserve nested object structure', async () => {
      const nested = { level1: { level2: { level3: 'value' } } };
      await setRegisterFormFlashData(nested);
      const result = await getRegisterFormFlashData();
      expect(result.level1.level2.level3).toBe('value');
    });

    it('should handle arrays in data', async () => {
      await setRegisterFormFlashData({ arr: [1, 2, 3, 4, 5] });
      const result = await getRegisterFormFlashData();
      expect(result.arr).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle null values in data', async () => {
      await setRegisterFormFlashData({ nullable: null, other: 'value' });
      const result = await getRegisterFormFlashData();
      expect(result.nullable).toBeNull();
      expect(result.other).toBe('value');
    });

    it('clearRegisterFormFlashData followed by getRegisterFormFlashData should return null', async () => {
      await setRegisterFormFlashData({ test: 'data' });
      await clearRegisterFormFlashData();
      const result = await getRegisterFormFlashData();
      expect(result).toBeNull();
    });

    it('multiple clearRegisterFormFlashData calls should be idempotent', async () => {
      await setRegisterFormFlashData({ test: 'data' });
      await clearRegisterFormFlashData();
      await clearRegisterFormFlashData();
      expect(await getRegisterFormFlashData()).toBeNull();
    });

    it('should not share state between default and injected stores', async () => {
      const otherBackend = new MemoryBackend();
      const otherStore = new DandelionStore();
      otherStore.init(otherBackend);

      await setRegisterFormFlashData({ key: 'default' });
      await setRegisterFormFlashData({ key: 'other' }, otherStore);

      const defaultData = await getRegisterFormFlashData();
      expect(defaultData.key).toBe('default');

      const otherData = await getRegisterFormFlashData(600_000, otherStore);
      expect(otherData.key).toBe('other');
    });
  });
});
