import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';
import {
  getNotCheckedList,
  isInNotCheckedList,
  toggleNotCheckedItem,
} from '../../src/utils/notChecked.js';

async function setupConfig(listStr = '') {
  store.init(new MemoryBackend());
  await store.setConfig({
    activeProfile: 'profile1',
    profiles: {
      profile1: {
        name: 'Profile 1',
        notChecked: { notCheckedList: listStr },
        formSkrining: {},
        skrining: {},
        zenMode: {},
        flashData: {},
      },
      profile2: {
        name: 'Profile 2',
        notChecked: {},
        formSkrining: {},
        skrining: {},
        zenMode: {},
        flashData: {},
      },
    },
  });
}

describe('notChecked', () => {
  it('getNotCheckedList should return empty array for empty list', async () => {
    await setupConfig('');
    expect(await getNotCheckedList()).toEqual([]);
  });

  it('getNotCheckedList should return parsed items', async () => {
    await setupConfig('a;b;c');
    expect(await getNotCheckedList()).toEqual(['a', 'b', 'c']);
  });

  it('isInNotCheckedList should return true for existing id', async () => {
    await setupConfig('a;b');
    expect(await isInNotCheckedList('a')).toBe(true);
  });

  it('isInNotCheckedList should return false for missing id', async () => {
    await setupConfig('a;b');
    expect(await isInNotCheckedList('x')).toBe(false);
  });

  it('toggleNotCheckedItem should remove existing id', async () => {
    await setupConfig('a;b');
    const result = await toggleNotCheckedItem('a');
    expect(result).toBe(false);
    expect(await isInNotCheckedList('a')).toBe(false);
  });

  it('toggleNotCheckedItem should add missing id', async () => {
    await setupConfig('a;b');
    const result = await toggleNotCheckedItem('x');
    expect(result).toBe(true);
    expect(await isInNotCheckedList('x')).toBe(true);
  });

  describe('error handling', () => {
    it('isInNotCheckedList should handle whitespace gracefully', async () => {
      await setupConfig('a;b');
      const result = await isInNotCheckedList('  ');
      expect(typeof result).toBe('boolean');
    });

    it('toggleNotCheckedItem should handle empty string', async () => {
      await setupConfig('a;b');
      const result = await toggleNotCheckedItem('');
      expect(typeof result).toBe('boolean');
    });

    it('should handle duplicate entries gracefully', async () => {
      await setupConfig('a;a;a');
      const list = await getNotCheckedList();
      expect(Array.isArray(list)).toBe(true);
    });

    it('should handle items with special characters', async () => {
      const result = await toggleNotCheckedItem('id-@#$%^&*()');
      expect(typeof result).toBe('boolean');
    });

    it('toggleNotCheckedItem should preserve other items', async () => {
      await setupConfig('a;b;c');
      await toggleNotCheckedItem('b');
      expect(await isInNotCheckedList('a')).toBe(true);
      expect(await isInNotCheckedList('c')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very long id strings', async () => {
      const longId = 'x'.repeat(1000);
      const result = await toggleNotCheckedItem(longId);
      expect(typeof result).toBe('boolean');
    });

    it('should maintain list integrity after many operations', async () => {
      await setupConfig('a');
      for (let i = 0; i < 10; i++) {
        await toggleNotCheckedItem(`item${i}`);
      }
      const list = await getNotCheckedList();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });
});
