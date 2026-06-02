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
  await browser.storage.local.set({ [STORAGE_KEY]: data });
}

/**
 * Read flash data from storage
 * @returns {Promise<FlashData|null>}
 */
export async function getFlashData() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || null;
}

/**
 * Remove flash data from storage
 */
export async function clearFlashData() {
  await browser.storage.local.remove(STORAGE_KEY);
}
