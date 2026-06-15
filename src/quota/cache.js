import { store } from '../store.js';

export async function getCache() {
  return await store.getCache();
}

export async function setCache(state) {
  await store.setCache(state);
}

export async function clearCache() {
  await store.clearCache();
}
