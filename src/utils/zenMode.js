import { store as globalStore } from '../store.js';

/**
 * @typedef {Object} ZenModeState
 * @property {boolean} active - Whether Zen Mode is enabled.
 * @property {string[]} queue - List of IDs to visit.
 * @property {number} total - Total number of IDs initially in the queue.
 * @property {'zen'|'zero'} [mode] - Which automation owns the queue (Zen or Zero Mode).
 */

/**
 * Gets the current Zen Mode state from extension storage.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<ZenModeState>}
 */
export async function getZenModeState(store = globalStore) {
  return await store.getZenModeState();
}

/**
 * Saves the Zen Mode state to extension storage.
 * @param {ZenModeState} state
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<void>}
 */
export async function setZenModeState(state, store = globalStore) {
  await store.setZenModeState(state);
}

/**
 * Checks if Zen Mode is currently active.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<boolean>}
 */
export async function isZenModeActive(store = globalStore) {
  const state = await getZenModeState(store);
  return state.active;
}

/**
 * Checks if the Zen automation owns the current queue.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<boolean>}
 */
export async function isZenRunning(store = globalStore) {
  const state = await getZenModeState(store);
  return state.active && state.mode !== 'zero' && state.queue.length > 0;
}

/**
 * Adds IDs to the Zen Mode queue.
 * @param {string[]} ids
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<void>}
 */
export async function addToQueue(ids, store = globalStore) {
  const state = await getZenModeState(store);
  state.queue = ids;
  state.total = ids.length;
  await setZenModeState(state, store);
}

/**
 * Gets the next ID from the queue without removing it.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<string|null>}
 */
export async function peekNextFromQueue(store = globalStore) {
  const state = await getZenModeState(store);
  if (state.queue.length === 0) return null;
  return state.queue[0];
}

/**
 * Gets and removes the next ID from the queue.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<string|null>}
 */
export async function getNextFromQueue(store = globalStore) {
  const state = await getZenModeState(store);
  if (state.queue.length === 0) return null;
  const nextId = state.queue.shift();
  await setZenModeState(state, store);
  return nextId;
}

/**
 * Skips the current first item in the queue.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<void>}
 */
export async function skipQueue(store = globalStore) {
  const state = await getZenModeState(store);
  if (state.queue.length > 0) {
    state.queue.shift();
    await setZenModeState(state, store);
  }
}

/**
 * Clears the queue and deactivates Zen Mode.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<void>}
 */
export async function clearZenMode(store = globalStore) {
  await store.clearZenMode();
}
