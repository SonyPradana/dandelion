import { describe, it, expect, vi } from 'vitest';
import { store, DandelionStore } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';
import {
  getAnswers,
  saveAnswers,
  addAnswer,
  removeAnswer,
  isAnswerPinned,
  getSkriningExcludes,
  toggleSkriningExclude,
} from '../../src/utils/skriningConfig.js';

async function setupConfig({ answers = {}, excludes = '' } = {}) {
  store.init(new MemoryBackend());
  await store.setConfig({
    activeProfile: 'profile1',
    profiles: {
      profile1: { name: 'Profile 1', skrining: { url: 'skrining', answers, excludes } },
      profile2: { name: 'Profile 2', skrining: { url: 'skrining', answers: {}, excludes: '' } },
    },
  });
}

describe('skriningConfig', () => {
  describe('answers', () => {
    it('getAnswers should return empty object when answers missing', async () => {
      store.init(new MemoryBackend());
      await store.setConfig({
        activeProfile: 'profile1',
        profiles: { profile1: { name: 'Profile 1', skrining: {} } },
      });
      expect(await getAnswers()).toEqual({});
    });

    it('getAnswers should return stored answers', async () => {
      await setupConfig({ answers: { answer8AA: 'B' } });
      expect(await getAnswers()).toEqual({ answer8AA: 'B' });
    });

    it('addAnswer should add a new answer', async () => {
      await setupConfig();
      await addAnswer('answer8AA', 'B');
      expect(await getAnswers()).toEqual({ answer8AA: 'B' });
    });

    it('addAnswer should overwrite existing key', async () => {
      await setupConfig({ answers: { answer8AA: 'A' } });
      await addAnswer('answer8AA', 'B');
      expect(await getAnswers()).toEqual({ answer8AA: 'B' });
    });

    it('addAnswer should not touch the other profile', async () => {
      await setupConfig();
      await addAnswer('answer8AA', 'B');
      const config = await store.getFullConfig();
      expect(config.profiles.profile2.skrining.answers).toEqual({});
    });

    it('removeAnswer should remove an existing answer', async () => {
      await setupConfig({ answers: { answer8AA: 'B' } });
      await removeAnswer('answer8AA');
      expect(await getAnswers()).toEqual({});
    });

    it('removeAnswer should handle non-existent key', async () => {
      await setupConfig({ answers: { answer8AA: 'B' } });
      await removeAnswer('missing');
      expect(await getAnswers()).toEqual({ answer8AA: 'B' });
    });

    it('isAnswerPinned should return true for existing key', async () => {
      await setupConfig({ answers: { answer8AA: 'B' } });
      expect(await isAnswerPinned('answer8AA')).toBe(true);
    });

    it('isAnswerPinned should return false for missing key', async () => {
      await setupConfig();
      expect(await isAnswerPinned('answer8AA')).toBe(false);
    });

    it('saveAnswers should replace the whole object', async () => {
      await setupConfig({ answers: { answer8AA: 'A', answer9AA: 'B' } });
      await saveAnswers({ answer8AA: 'B' });
      expect(await getAnswers()).toEqual({ answer8AA: 'B' });
    });
  });

  describe('excludes', () => {
    it('getSkriningExcludes should return empty array when excludes missing', async () => {
      store.init(new MemoryBackend());
      await store.setConfig({
        activeProfile: 'profile1',
        profiles: { profile1: { name: 'Profile 1', skrining: {} } },
      });
      expect(await getSkriningExcludes()).toEqual([]);
    });

    it('getSkriningExcludes should split on semicolon and drop empty entries', async () => {
      await setupConfig({ excludes: 'answer8AA;answer1BA;;' });
      expect(await getSkriningExcludes()).toEqual(['answer8AA', 'answer1BA']);
    });

    it('toggleSkriningExclude should add and return true', async () => {
      await setupConfig();
      expect(await toggleSkriningExclude('answer8AA')).toBe(true);
      expect(await getSkriningExcludes()).toEqual(['answer8AA']);
    });

    it('toggleSkriningExclude should remove and return false', async () => {
      await setupConfig({ excludes: 'answer8AA;answer1BA' });
      expect(await toggleSkriningExclude('answer8AA')).toBe(false);
      expect(await getSkriningExcludes()).toEqual(['answer1BA']);
    });

    it('toggleSkriningExclude should remove every duplicate entry at once', async () => {
      await setupConfig({ excludes: 'answer8AA;answer8AA' });
      expect(await toggleSkriningExclude('answer8AA')).toBe(false);
      expect(await getSkriningExcludes()).toEqual([]);
    });

    it('toggleSkriningExclude should keep skrining url intact', async () => {
      await setupConfig();
      await toggleSkriningExclude('answer8AA');
      const config = await store.getFullConfig();
      expect(config.profiles.profile1.skrining.url).toBe('skrining');
    });
  });

  describe('profile binding', () => {
    const baseConfig = () => ({
      activeProfile: 'profile1',
      profiles: {
        profile1: { name: 'Profile 1', skrining: { url: 'skrining', answers: {}, excludes: '' } },
        profile2: { name: 'Profile 2', skrining: { url: 'skrining', answers: {}, excludes: '' } },
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

    it('addAnswer should write to the profile that was active when it started', async () => {
      const local = await localStore();
      simulateProfileSwitch(local);

      await addAnswer('answer8AA', 'B', local);

      expect(await getAnswers(local, 'profile1')).toEqual({ answer8AA: 'B' });
      expect(await getAnswers(local, 'profile2')).toEqual({});
    });

    it('toggleSkriningExclude should write to the profile that was active when it started', async () => {
      const local = await localStore();
      simulateProfileSwitch(local);

      await toggleSkriningExclude('answer8AA', local);

      expect(await getSkriningExcludes(local, 'profile1')).toEqual(['answer8AA']);
      expect(await getSkriningExcludes(local, 'profile2')).toEqual([]);
    });

    it('should serialize two concurrent excludes', async () => {
      const local = await localStore();

      await Promise.all([
        toggleSkriningExclude('answer8AA', local),
        toggleSkriningExclude('answer1BA', local),
      ]);

      expect(await getSkriningExcludes(local)).toEqual(['answer8AA', 'answer1BA']);
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

      await expect(toggleSkriningExclude('answer8AA', local)).rejects.toThrow('profile1');
      expect(setSpy).not.toHaveBeenCalled();
    });
  });
});
