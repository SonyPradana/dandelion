import { store as globalStore } from '../store.js';

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function getCache(store = globalStore) {
  return await store.getCache();
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function setCache(state, store = globalStore) {
  await store.setCache(state);
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function clearCache(store = globalStore) {
  await store.clearCache();
}
