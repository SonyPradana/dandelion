import { describe, it, expect, vi } from 'vitest';
import { store, DandelionStore } from '../../src/store.js';
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

  describe('profile binding', () => {
    const baseConfig = () => ({
      activeProfile: 'profile1',
      profiles: {
        profile1: { name: 'Profile 1', notChecked: { notCheckedList: 'a;b' } },
        profile2: { name: 'Profile 2', notChecked: {} },
      },
    });

    async function localStore() {
      const local = new DandelionStore();
      local.init(new MemoryBackend({ clone: true }));
      await local.setConfig(baseConfig());
      return local;
    }

    /**
     * Returns a fresh clone and flips the active profile on the second read,
     * simulating a profile switch between the helper's read and write.
     */
    function simulateProfileSwitch(local) {
      const original = local.getFullConfig.bind(local);
      let calls = 0;
      local.getFullConfig = async () => {
        const config = structuredClone(await original());
        calls += 1;
        if (calls === 2) config.activeProfile = 'profile2';
        return config;
      };
    }

    it('toggleNotCheckedItem should write to the profile that was active when it started', async () => {
      const local = await localStore();
      simulateProfileSwitch(local);

      await toggleNotCheckedItem('x', local);

      expect(await isInNotCheckedList('x', local, 'profile1')).toBe(true);
      expect(await isInNotCheckedList('x', local, 'profile2')).toBe(false);
    });

    it('should serialize two concurrent toggles', async () => {
      const local = await localStore();

      await Promise.all([toggleNotCheckedItem('x', local), toggleNotCheckedItem('y', local)]);

      expect(await isInNotCheckedList('x', local)).toBe(true);
      expect(await isInNotCheckedList('y', local)).toBe(true);
    });

    it('should reject when the bound profile disappears mid-operation', async () => {
      const local = await localStore();
      const original = local.getFullConfig.bind(local);
      let calls = 0;
      local.getFullConfig = async () => {
        const config = structuredClone(await original());
        calls += 1;
        if (calls === 2) delete config.profiles.profile1;
        return config;
      };
      const setSpy = vi.spyOn(local, 'setConfig');

      await expect(toggleNotCheckedItem('x', local)).rejects.toThrow('profile1');
      expect(setSpy).not.toHaveBeenCalled();
    });
  });
});
