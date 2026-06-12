import { store } from '../store';

const DEFAULT_STATE = { active: false, queue: [], total: 0 };

export async function getZenModeState() {
  const state = await store.getZenModeState();
  return state.active !== undefined ? state : DEFAULT_STATE;
}

export async function setZenModeState(state) {
  await store.setZenModeState(state);
}

export async function isZenModeActive() {
  const state = await getZenModeState();
  return state.active;
}

export async function addToQueue(ids) {
  const state = await getZenModeState();
  state.queue = ids;
  state.total = ids.length;
  await setZenModeState(state);
}

export async function peekNextFromQueue() {
  const state = await getZenModeState();
  if (state.queue.length === 0) return null;
  return state.queue[0];
}

export async function getNextFromQueue() {
  const state = await getZenModeState();
  if (state.queue.length === 0) return null;
  const nextId = state.queue.shift();
  await setZenModeState(state);
  return nextId;
}

export async function skipQueue() {
  const state = await getZenModeState();
  if (state.queue.length > 0) {
    state.queue.shift();
    await setZenModeState(state);
  }
}

export async function clearZenMode() {
  await store.clearZenMode();
}
