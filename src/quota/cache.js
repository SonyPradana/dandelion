import browser from 'webextension-polyfill';

const CACHE_KEY = 'license-cache';
const TTL_MS = 10 * 60 * 1000;

export async function getCache() {
  try {
    const result = await browser.storage.local.get(CACHE_KEY);
    const cache = result[CACHE_KEY];
    if (!cache || typeof cache.cachedAt !== 'number') return null;
    if (isExpired(cache.cachedAt)) {
      await clearCache();
      return null;
    }
    return cache;
  } catch {
    return null;
  }
}

export async function setCache(state) {
  await browser.storage.local.set({
    [CACHE_KEY]: { ...state, cachedAt: Date.now() },
  });
}

export async function clearCache() {
  await browser.storage.local.remove(CACHE_KEY);
}

export function isExpired(cachedAt) {
  return Date.now() - cachedAt > TTL_MS;
}
