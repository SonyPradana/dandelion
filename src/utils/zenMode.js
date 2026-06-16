import { store as globalStore } from '../store.js';

export async function getZenModeState(store = globalStore) {
  return await store.getZenModeState();
}

export async function setZenModeState(state, store = globalStore) {
  await store.setZenModeState(state);
}

export async function isZenModeActive(store = globalStore) {
  const state = await getZenModeState(store);
  return state.active;
}

export async function addToQueue(ids, store = globalStore) {
  const state = await getZenModeState(store);
  state.queue = ids;
  state.total = ids.length;
  await setZenModeState(state, store);
}

export async function peekNextFromQueue(store = globalStore) {
  const state = await getZenModeState(store);
  if (state.queue.length === 0) return null;
  return state.queue[0];
}

export async function getNextFromQueue(store = globalStore) {
  const state = await getZenModeState(store);
  if (state.queue.length === 0) return null;
  const nextId = state.queue.shift();
  await setZenModeState(state, store);
  return nextId;
}

export async function skipQueue(store = globalStore) {
  const state = await getZenModeState(store);
  if (state.queue.length > 0) {
    state.queue.shift();
    await setZenModeState(state, store);
  }
}

export async function clearZenMode(store = globalStore) {
  await store.clearZenMode();
}
