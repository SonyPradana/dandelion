import { store } from '../store.js';

/**
 * @typedef {Object} ZenModeState
 * @property {boolean} active - Whether Zen Mode is enabled.
 * @property {string[]} queue - List of IDs to visit.
 * @property {number} total - Total number of IDs initially in the queue.
 */

/**
 * Gets the current Zen Mode state from extension storage.
 * @returns {Promise<ZenModeState>}
 */
export async function getZenModeState() {
  return await store.getZenModeState();
}

/**
 * Saves the Zen Mode state to extension storage.
 * @param {ZenModeState} state
 * @returns {Promise<void>}
 */
export async function setZenModeState(state) {
  await store.setZenModeState(state);
}

/**
 * Checks if Zen Mode is currently active.
 * @returns {Promise<boolean>}
 */
export async function isZenModeActive() {
  const state = await getZenModeState();
  return state.active;
}

/**
 * Adds IDs to the Zen Mode queue.
 * @param {string[]} ids
 * @returns {Promise<void>}
 */
export async function addToQueue(ids) {
  const state = await getZenModeState();
  state.queue = ids;
  state.total = ids.length;
  await setZenModeState(state);
}

/**
 * Gets the next ID from the queue without removing it.
 * @returns {Promise<string|null>}
 */
export async function peekNextFromQueue() {
  const state = await getZenModeState();
  if (state.queue.length === 0) return null;
  return state.queue[0];
}

/**
 * Gets and removes the next ID from the queue.
 * @returns {Promise<string|null>}
 */
export async function getNextFromQueue() {
  const state = await getZenModeState();
  if (state.queue.length === 0) return null;
  const nextId = state.queue.shift();
  await setZenModeState(state);
  return nextId;
}

/**
 * Skips the current first item in the queue.
 * @returns {Promise<void>}
 */
export async function skipQueue() {
  const state = await getZenModeState();
  if (state.queue.length > 0) {
    state.queue.shift();
    await setZenModeState(state);
  }
}

/**
 * Clears the queue and deactivates Zen Mode.
 * @returns {Promise<void>}
 */
export async function clearZenMode() {
  await store.clearZenMode();
}
