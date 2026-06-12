import { store } from '../store';

export async function getCache() {
  return store.getCache();
}

export async function setCache(state) {
  await store.setCache(state);
}

export async function clearCache() {
  await store.clearCache();
}
