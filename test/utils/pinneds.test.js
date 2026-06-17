import { describe, it, expect } from 'vitest';
import { store } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';
import {
  getPinnedItems,
  addPinnedItem,
  removePinnedItem,
  isPinned,
} from '../../src/utils/pinneds.js';

async function setupConfig(pinneds = {}) {
  store.init(new MemoryBackend());
  await store.setConfig({
    activeProfile: 'profile1',
    profiles: {
      profile1: {
        name: 'Profile 1',
        formSkrining: { pinneds, excludes: '' },
        notChecked: {},
        skrining: {},
        zenMode: {},
        flashData: {},
      },
      profile2: {
        name: 'Profile 2',
        formSkrining: {},
        notChecked: {},
        skrining: {},
        zenMode: {},
        flashData: {},
      },
    },
  });
}

describe('pinneds', () => {
  it('getPinnedItems should return empty object when no pinneds', async () => {
    await setupConfig();
    expect(await getPinnedItems()).toEqual({});
  });

  it('getPinnedItems should return pinned items', async () => {
    await setupConfig({ key1: 'val1', key2: 'val2' });
    const items = await getPinnedItems();
    expect(items).toEqual({ key1: 'val1', key2: 'val2' });
  });

  it('addPinnedItem should add a new item', async () => {
    await setupConfig({});
    await addPinnedItem('color', 'red');
    const items = await getPinnedItems();
    expect(items.color).toBe('red');
  });

  it('removePinnedItem should remove an existing item', async () => {
    await setupConfig({ key1: 'val1' });
    await removePinnedItem('key1');
    const items = await getPinnedItems();
    expect(items).toEqual({});
  });

  it('isPinned should return true for pinned key', async () => {
    await setupConfig({ key1: 'val1' });
    expect(await isPinned('key1')).toBe(true);
  });

  it('isPinned should return false for non-pinned key', async () => {
    await setupConfig({ key1: 'val1' });
    expect(await isPinned('missing')).toBe(false);
  });

  describe('error handling', () => {
    it('addPinnedItem should overwrite existing key with new value', async () => {
      await setupConfig({ key1: 'old' });
      await addPinnedItem('key1', 'new');
      const items = await getPinnedItems();
      expect(items.key1).toBe('new');
    });

    it('removePinnedItem should handle non-existent key gracefully', async () => {
      await setupConfig({ key1: 'val1' });
      expect(async () => {
        await removePinnedItem('nonexistent');
      }).not.toThrow();
      const items = await getPinnedItems();
      expect(items.key1).toBe('val1');
    });

    it('should handle empty string as key', async () => {
      await setupConfig({});
      await addPinnedItem('', 'value');
      const items = await getPinnedItems();
      expect(typeof items).toBe('object');
    });

    it('should handle empty string as value', async () => {
      await setupConfig({});
      await addPinnedItem('key', '');
      const items = await getPinnedItems();
      expect(items.key).toBe('');
    });

    it('should handle special characters in keys', async () => {
      await setupConfig({});
      await addPinnedItem('key-@#$%', 'value');
      expect(await isPinned('key-@#$%')).toBe(true);
    });

    it('should handle reserved key names', async () => {
      await setupConfig({});
      await addPinnedItem('__proto__', 'value');
      const items = await getPinnedItems();
      expect(typeof items).toBe('object');
    });
  });

  describe('edge cases', () => {
    it('should handle very long keys', async () => {
      const longKey = 'k'.repeat(1000);
      await setupConfig({});
      await addPinnedItem(longKey, 'value');
      expect(await isPinned(longKey)).toBe(true);
    });

    it('should handle very long values', async () => {
      const longValue = 'v'.repeat(1000);
      await setupConfig({});
      await addPinnedItem('key', longValue);
      const items = await getPinnedItems();
      expect(items.key).toBe(longValue);
    });

    it('should preserve multiple items across operations', async () => {
      await setupConfig({});
      await addPinnedItem('key1', 'val1');
      await addPinnedItem('key2', 'val2');
      await addPinnedItem('key3', 'val3');
      expect(await isPinned('key1')).toBe(true);
      expect(await isPinned('key2')).toBe(true);
      expect(await isPinned('key3')).toBe(true);
    });

    it('should handle complex objects as values', async () => {
      await setupConfig({});
      const complexValue = { nested: { deep: 'value' }, array: [1, 2, 3] };
      await addPinnedItem('complex', complexValue);
      const items = await getPinnedItems();
      expect(typeof items.complex).toBe('object');
    });
  });
});
