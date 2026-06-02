import browser from 'webextension-polyfill';

const STORAGE_KEY = 'flash_data';

/**
 * @typedef {Object} FlashData
 * @property {Object.<string, string>} pinneds - Key-value pairs untuk override pinneds
 */

/**
 * Simpan flash data ke storage
 * @param {FlashData} data
 * @returns {Promise<void>}
 */
export async function setFlashData(data) {
  await browser.storage.local.set({ [STORAGE_KEY]: data });
}

/**
 * Ambil flash data dari storage
 * @returns {Promise<FlashData|null>}
 */
export async function getFlashData() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || null;
}

/**
 * Hapus flash data dari storage
 * @returns {Promise<void>}
 */
export async function clearFlashData() {
  await browser.storage.local.remove(STORAGE_KEY);
}
