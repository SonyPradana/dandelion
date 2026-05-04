import browser from 'webextension-polyfill';

const STORAGE_KEY = 'dandelion_zen_mode_state';

/**
 * @typedef {Object} ZenModeState
 * @property {boolean} active - Whether Zen Mode is enabled.
 * @property {string[]} queue - List of IDs to visit.
 * @property {number} total - Total number of IDs initially in the queue.
 */

const DEFAULT_STATE = { active: false, queue: [], total: 0 };

/**
 * Gets the current Zen Mode state from extension storage.
 * @returns {Promise<ZenModeState>}
 */
export async function getZenModeState() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const state = result[STORAGE_KEY] || DEFAULT_STATE;
  return state;
}

/**
 * Saves the Zen Mode state to extension storage.
 * @param {ZenModeState} state 
 * @returns {Promise<void>}
 */
export async function setZenModeState(state) {
  await browser.storage.local.set({ [STORAGE_KEY]: state });
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
  await browser.storage.local.remove(STORAGE_KEY);
}
