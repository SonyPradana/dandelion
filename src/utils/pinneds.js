import { store } from '../store.js';

export async function getPinnedItems() {
  const config = await store.getActiveConfig();
  const pinneds = config.formSkrining?.pinneds;
  return typeof pinneds === 'object' && pinneds !== null ? pinneds : {};
}

export async function savePinnedItems(items) {
  const config = await store.getFullConfig();
  const activeProfile = config.activeProfile;

  if (config.profiles && config.profiles[activeProfile]) {
    if (!config.profiles[activeProfile].formSkrining) {
      config.profiles[activeProfile].formSkrining = {};
    }
    config.profiles[activeProfile].formSkrining.pinneds = items;
  }

  await store.setConfig(config);
}

/**
 * Adds or updates a single pinned item.
 * @param {string} key - The key (data-name) of the item.
 * @param {string} value - The value (text) of the item.
 * @returns {Promise<void>}
 */
export async function addPinnedItem(key, value) {
  const items = await getPinnedItems();
  items[key] = value;
  await savePinnedItems(items);
}

/**
 * Removes a single pinned item.
 * @param {string} key - The key (data-name) of the item to remove.
 * @returns {Promise<void>}
 */
export async function removePinnedItem(key) {
  const items = await getPinnedItems();
  delete items[key];
  await savePinnedItems(items);
}

/**
 * Checks if an item is already pinned.
 * @param {string} key - The key (data-name) of the item to check.
 * @returns {Promise<boolean>}
 */
export async function isPinned(key) {
  const items = await getPinnedItems();
  return Object.prototype.hasOwnProperty.call(items, key);
}
