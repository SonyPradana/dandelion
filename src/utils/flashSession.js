import { store as globalStore } from '../store.js';

const STORAGE_KEY = 'flash_data';

/**
 * @typedef {Object} FlashData
 * @property {Object.<string, string>} pinneds - Key-value pairs to override
 */

/**
 * Save flash data to storage
 * @param {FlashData} data
 */
export async function setFlashData(data, store = globalStore) {
  data._timestamp = Date.now();
  await store.storageSet(STORAGE_KEY, data);
}

/**
 * Read flash data from storage
 * @param {number} [maxAge=600000] - Max age in ms before data is considered stale
 * @returns {Promise<FlashData|null>}
 */
export async function getFlashData(maxAge = 600_000, store = globalStore) {
  const data = await store.storageGet(STORAGE_KEY);
  if (data && data._timestamp && Date.now() - data._timestamp > maxAge) {
    await clearFlashData();
    return null;
  }
  return data;
}

/**
 * Remove flash data from storage
 */
export async function clearFlashData(store = globalStore) {
  await store.storageRemove(STORAGE_KEY);
}
