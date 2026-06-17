import { store as globalStore } from '../store.js';

export async function getCache(store = globalStore) {
  return await store.getCache();
}

export async function setCache(state, store = globalStore) {
  await store.setCache(state);
}

export async function clearCache(store = globalStore) {
  await store.clearCache();
}
