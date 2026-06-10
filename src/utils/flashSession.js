import browser from 'webextension-polyfill';

const STORAGE_KEY = 'flash_data';

/**
 * @typedef {Object} FlashData
 * @property {Object.<string, string>} pinneds - Key-value pairs to override
 */

/**
 * Save flash data to storage
 * @param {FlashData} data
 */
export async function setFlashData(data) {
  data._timestamp = Date.now();
  await browser.storage.local.set({ [STORAGE_KEY]: data });
}

/**
 * Read flash data from storage
 * @param {number} [maxAge=600000] - Max age in ms before data is considered stale
 * @returns {Promise<FlashData|null>}
 */
export async function getFlashData(maxAge = 600_000) {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY] || null;
  if (data && data._timestamp && Date.now() - data._timestamp > maxAge) {
    await clearFlashData();
    return null;
  }
  return data;
}

/**
 * Remove flash data from storage
 */
export async function clearFlashData() {
  await browser.storage.local.remove(STORAGE_KEY);
}
