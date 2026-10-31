import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store, DandelionStore } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';
import { isExcluded, toggleExclude } from '../../src/utils/excludes.js';

async function setupConfig(excludesStr) {
  store.init(new MemoryBackend());
  await store.setConfig({
    activeProfile: 'profile1',
    profiles: {
      profile1: {
        name: 'Profile 1',
        formSkrining: { excludes: excludesStr, pinneds: {} },
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

describe('excludes', () => {
  beforeEach(async () => {
    await setupConfig('a;b;c');
  });

  it('isExcluded should return true for excluded item', async () => {
    expect(await isExcluded('a')).toBe(true);
  });

  it('isExcluded should return false for non-excluded item', async () => {
    expect(await isExcluded('x')).toBe(false);
  });

  it('isExcluded should return false when excludes is empty', async () => {
    await setupConfig('');
    expect(await isExcluded('a')).toBe(false);
  });

  it('toggleExclude should remove item if already excluded', async () => {
    const result = await toggleExclude('a');
    expect(result).toBe(false);
    expect(await isExcluded('a')).toBe(false);
  });

  it('toggleExclude should add item if not excluded', async () => {
    const result = await toggleExclude('x');
    expect(result).toBe(true);
    expect(await isExcluded('x')).toBe(true);
  });

  describe('error handling', () => {
    it('isExcluded should handle whitespace in item names', async () => {
      const result = await isExcluded('  a  ');
      expect(typeof result).toBe('boolean');
    });

    it('toggleExclude should handle special characters', async () => {
      const result = await toggleExclude('item-@#$%');
      expect(typeof result).toBe('boolean');
    });

    it('toggleExclude should handle empty string gracefully', async () => {
      const result = await toggleExclude('');
      expect(typeof result).toBe('boolean');
    });

    it('should handle multiple rapid toggling', async () => {
      await toggleExclude('item1');
      await toggleExclude('item1');
      const result = await isExcluded('item1');
      expect(result).toBe(false);
    });

    it('should handle items with semicolons (edge case)', async () => {
      const result = await toggleExclude('x;y;z');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('isExcluded should work with very long item names', async () => {
      const longName = 'a'.repeat(1000);
      const result = await isExcluded(longName);
      expect(typeof result).toBe('boolean');
    });

    it('should preserve state across multiple operations', async () => {
      await toggleExclude('test1');
      await toggleExclude('test2');
      await toggleExclude('test3');
      expect(await isExcluded('test1')).toBe(true);
      expect(await isExcluded('test2')).toBe(true);
      expect(await isExcluded('test3')).toBe(true);
    });
  });

  describe('profile binding', () => {
    const baseConfig = () => ({
      activeProfile: 'profile1',
      profiles: {
        profile1: { name: 'Profile 1', formSkrining: { excludes: 'a;b;c' } },
        profile2: { name: 'Profile 2', formSkrining: {} },
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

    it('toggleExclude should write to the profile that was active when it started', async () => {
      const local = await localStore();
      simulateProfileSwitch(local);

      await toggleExclude('x', local);

      expect(await isExcluded('x', local, 'profile1')).toBe(true);
      expect(await isExcluded('x', local, 'profile2')).toBe(false);
    });

    it('should serialize two concurrent toggles', async () => {
      const local = await localStore();

      await Promise.all([toggleExclude('x', local), toggleExclude('y', local)]);

      expect(await isExcluded('x', local)).toBe(true);
      expect(await isExcluded('y', local)).toBe(true);
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

      await expect(toggleExclude('x', local)).rejects.toThrow('profile1');
      expect(setSpy).not.toHaveBeenCalled();
    });
  });
});
