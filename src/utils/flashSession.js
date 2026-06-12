import { store } from '../store';

/**
 * @typedef {Object} FlashData
 * @property {Object.<string, string>} pinneds - Key-value pairs to override
 */

export async function setFlashData(data) {
  await store.setFlashData(data);
}

export async function getFlashData() {
  return store.getFlashData();
}

export async function clearFlashData() {
  await store.clearFlashData();
}
