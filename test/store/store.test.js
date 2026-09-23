import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../../src/store.js';
import { MemoryBackend } from '../__support__/memory-backend.js';

let backend = null;

beforeEach(() => {
  backend = new MemoryBackend();
  store.init(backend);
});

describe('init', () => {
  it('should accept MemoryBackend without error', () => {
    expect(() => store.init(new MemoryBackend())).not.toThrow();
  });
});

describe('raw storage', () => {
  it('should get/set/remove a single key', async () => {
    await store.storageSet('foo', 'bar');
    expect(await store.storageGet('foo')).toBe('bar');

    await store.storageRemove('foo');
    expect(await store.storageGet('foo')).toBeNull();
  });

  it('should get/set/remove multiple keys', async () => {
    await store.storageSetMany({ a: 1, b: 2 });
    const result = await store.storageGetMany(['a', 'b']);
    expect(result).toEqual({ a: 1, b: 2 });

    await store.storageRemoveMany(['a', 'b']);
    const after = await store.storageGetMany(['a', 'b']);
    expect(after).toEqual({ a: null, b: null });
  });
});

describe('config', () => {
  it('getFullConfig should hit storage only once across repeated calls', async () => {
    const getSpy = vi.spyOn(backend.storage.local, 'get');
    await store.getFullConfig();
    await store.getFullConfig();
    await store.getFullConfig();
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('getFullConfig should reflect writes made via setConfig (cache must not go stale)', async () => {
    const config = await store.getFullConfig();
    config.activeProfile = 'profile2';
    await store.setConfig(config);
    const reloaded = await store.getFullConfig();
    expect(reloaded.activeProfile).toBe('profile2');
  });

  it('init() should reset cache so a new backend starts clean', async () => {
    const backendA = new MemoryBackend();
    store.init(backendA);
    await store.setConfig({ activeProfile: 'profile1' });
    await store.getFullConfig();
    const backendB = new MemoryBackend();
    await backendB.storage.local.set({ activeProfile: 'profile9' });
    store.init(backendB);
    const config = await store.getFullConfig();
    expect(config.activeProfile).toBe('profile9');
  });

  it('getFullConfig should return config with activeProfile', async () => {
    const config = await store.getFullConfig();
    expect(config).toHaveProperty('activeProfile');
    expect(config).toHaveProperty('profiles');
    expect(config.activeProfile).toBe('profile1');
  });

  it('setConfig should persist config', async () => {
    const config = await store.getFullConfig();
    config.panelPosition = 'bottom-left';
    await store.setConfig(config);

    const reloaded = await store.getFullConfig();
    expect(reloaded.panelPosition).toBe('bottom-left');
  });

  it('getFullConfig should return the newly set config without re-reading storage', async () => {
    await store.getFullConfig();
    const getSpy = vi.spyOn(backend.storage.local, 'get');
    await store.setConfig({
      activeProfile: 'profile3',
      panelPosition: 'bottom-right',
      profiles: {},
    });
    const reloaded = await store.getFullConfig();
    expect(reloaded.activeProfile).toBe('profile3');
    expect(reloaded.panelPosition).toBe('bottom-right');
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('non-config storage writes should keep the warm cache intact', async () => {
    await store.getFullConfig();
    const getSpy = vi.spyOn(backend.storage.local, 'get');
    await getSpy.mockClear();

    await backend.storage.local.set({ flash_data: { pinneds: { a: 'b' } } });

    const reloaded = await store.getFullConfig();
    expect(reloaded.activeProfile).toBe('profile1');
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('refreshConfig should re-read from storage even when cache is warm', async () => {
    await store.getFullConfig();
    await backend.storage.local.set({ activeProfile: 'profile2' });
    const reloaded = await store.refreshConfig();
    expect(reloaded.activeProfile).toBe('profile2');
  });

  it('refreshConfig should return the newest config when a write lands mid-read', async () => {
    const base = await store.getFullConfig();
    base.panelPosition = 'bottom-right';

    const originalGet = backend.storage.local.get;
    let releaseRead = null;
    backend.storage.local.get = vi.fn((...args) => {
      const snapshot = originalGet.call(backend.storage.local, ...args);
      return new Promise((resolve) => {
        releaseRead = () => snapshot.then(resolve);
      });
    });

    const refreshPromise = store.refreshConfig();

    await store.setConfig(base);

    releaseRead();
    const refreshed = await refreshPromise;

    expect(refreshed.panelPosition).toBe('bottom-right');
    const cached = await store.getFullConfig();
    expect(cached.panelPosition).toBe('bottom-right');
  });

  it('setConfig should drop the cache when the storage write fails', async () => {
    const base = await store.getFullConfig();
    base.panelPosition = 'bottom-right';
    await store.setConfig(base);

    backend.storage.local.set = vi.fn(() => Promise.reject(new Error('quota-exceeded')));

    await expect(
      store.setConfig({ activeProfile: 'profile1', panelPosition: 'top-left', profiles: {} }),
    ).rejects.toThrow('quota-exceeded');

    const reloaded = await store.getFullConfig();
    expect(reloaded.panelPosition).toBe('bottom-right');
  });

  it('setConfig failure should preserve a cache written by a newer generation', async () => {
    await store.setConfig({ activeProfile: 'profile1', panelPosition: 'top-right', profiles: {} });

    const originalSet = backend.storage.local.set;
    let rejectFirst = null;
    backend.storage.local.set = vi.fn((data) => {
      if (!rejectFirst) {
        return new Promise((_resolve, reject) => {
          rejectFirst = reject;
        });
      }
      return originalSet.call(backend.storage.local, data);
    });

    const failedPromise = store.setConfig({
      activeProfile: 'profile1',
      panelPosition: 'bottom-left',
      profiles: {},
    });

    await store.setConfig({
      activeProfile: 'profile1',
      panelPosition: 'center',
      profiles: {},
    });

    rejectFirst(new Error('quota-exceeded'));
    await expect(failedPromise).rejects.toThrow('quota-exceeded');

    const cached = await store.getFullConfig();
    expect(cached.panelPosition).toBe('center');
  });

  it('legacy migration should not persist when a write lands during the read', async () => {
    await backend.storage.local.set({ formSelector: 'https://example.test/form', profiles: {} });

    const originalGet = backend.storage.local.get;
    let releaseRead = null;
    backend.storage.local.get = vi.fn((...args) => {
      const snapshot = originalGet.call(backend.storage.local, ...args);
      return new Promise((resolve) => {
        releaseRead = () => snapshot.then(resolve);
      });
    });

    const readPromise = store.getFullConfig();

    const newer = { activeProfile: 'profile2', panelPosition: 'bottom-left', profiles: {} };
    await store.setConfig(newer);

    releaseRead();
    const config = await readPromise;

    expect(config.activeProfile).toBe('profile2');
    expect(backend.dump().activeProfile).toBe('profile2');
  });

  it('legacy migration should not overwrite the cache written during migration', async () => {
    await backend.storage.local.set({ formSelector: 'https://example.test/form', profiles: {} });

    const originalRemove = backend.storage.local.remove;
    let releaseRemove = null;
    backend.storage.local.remove = vi.fn((...args) => {
      const snapshot = originalRemove.call(backend.storage.local, ...args);
      return new Promise((resolve) => {
        releaseRemove = () => snapshot.then(resolve);
      });
    });

    const readPromise = store.getFullConfig();

    await Promise.resolve();

    const newer = { activeProfile: 'profile3', panelPosition: 'center', profiles: {} };
    await store.setConfig(newer);

    releaseRemove();
    const config = await readPromise;

    expect(config.panelPosition).toBe('center');
    const cached = await store.getFullConfig();
    expect(cached.panelPosition).toBe('center');
  });

  it('getActiveConfig should return profile settings', async () => {
    const active = await store.getActiveConfig();
    expect(active).toHaveProperty('formSkrining');
    expect(active).toHaveProperty('notChecked');
    expect(active).toHaveProperty('activeProfile');
  });

  it('setActiveProfile should switch profile', async () => {
    await store.setActiveProfile('profile2');
    const active = await store.getActiveConfig();
    expect(active.activeProfile).toBe('profile2');
  });
});

describe('agreement', () => {
  it('should return false by default', async () => {
    expect(await store.getAgreement()).toBe(false);
  });

  it('should persist agreement', async () => {
    await store.setAgreement(true);
    expect(await store.getAgreement()).toBe(true);

    await store.setAgreement(false);
    expect(await store.getAgreement()).toBe(false);
  });
});

describe('flash data', () => {
  it('should return null when empty', async () => {
    expect(await store.getFlashData()).toBeNull();
  });

  it('should get/set/clear flash data', async () => {
    await store.setFlashData({ pinneds: { key: 'val' } });
    const data = await store.getFlashData();
    expect(data).toHaveProperty('pinneds');
    expect(data.pinneds.key).toBe('val');

    await store.clearFlashData();
    expect(await store.getFlashData()).toBeNull();
  });
});

describe('zen mode', () => {
  it('should return defaults when empty', async () => {
    const state = await store.getZenModeState();
    expect(state).toEqual({ active: false, queue: [], total: 0 });
  });

  it('should get/set/clear zen mode', async () => {
    await store.setZenModeState({ active: true, queue: ['a'], total: 1 });
    const state = await store.getZenModeState();
    expect(state.active).toBe(true);
    expect(state.queue).toEqual(['a']);

    await store.clearZenMode();
    const after = await store.getZenModeState();
    expect(after.active).toBe(false);
  });
});

describe('productivity', () => {
  it('should return empty object when empty', async () => {
    expect(await store.loadProductivityData()).toEqual({});
  });

  it('should save and load productivity data', async () => {
    await store.saveProductivityData({ '2026-06-15': { dayTotal: 100, grandTotal: 100 } });
    const data = await store.loadProductivityData();
    expect(data['2026-06-15'].dayTotal).toBe(100);
  });
});

describe('device ID', () => {
  it('should return null when empty', async () => {
    expect(await store.getDeviceId()).toBeNull();
  });

  it('should set and get device ID', async () => {
    await store.setDeviceId('abc123');
    expect(await store.getDeviceId()).toBe('abc123');
  });
});

describe('quota token', () => {
  it('should return null when empty', async () => {
    expect(await store.getQuotaToken()).toBeNull();
  });

  it('should save/get/remove quota token', async () => {
    await store.saveQuotaToken('jwt.test.token');
    expect(await store.getQuotaToken()).toBe('jwt.test.token');

    await store.removeQuotaToken();
    expect(await store.getQuotaToken()).toBeNull();
  });
});

describe('cache', () => {
  it('should return null when empty', async () => {
    expect(await store.getCache()).toBeNull();
  });

  it('should set and get cache', async () => {
    await store.setCache({ status: 'valid' });
    const cache = await store.getCache();
    expect(cache.status).toBe('valid');
    expect(cache).toHaveProperty('cachedAt');
  });

  it('should clear cache', async () => {
    await store.setCache({ status: 'valid' });
    await store.clearCache();
    expect(await store.getCache()).toBeNull();
  });

  it('should return null for expired cache', async () => {
    await store.setCache({ status: 'valid' });

    backend._data.set('license-cache', {
      status: 'valid',
      cachedAt: Date.now() - 9 * 60 * 60 * 1000,
    });

    expect(await store.getCache()).toBeNull();
  });
});

describe('version', () => {
  it('should return test version from MemoryBackend', () => {
    expect(store.getManifestVersion()).toBe('0.0.0-test');
  });
});

describe('reset', () => {
  it('should clear all data after reset', async () => {
    await store.storageSet('foo', 'bar');
    await store.setDeviceId('abc');

    backend.reset();

    expect(await store.storageGet('foo')).toBeNull();
    expect(await store.getDeviceId()).toBeNull();
  });
});

describe('dump', () => {
  it('should return all stored entries', async () => {
    await store.storageSet('a', 1);
    await store.storageSet('b', 2);

    expect(backend.dump()).toEqual({ a: 1, b: 2 });
  });
});
