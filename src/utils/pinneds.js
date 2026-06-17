import { store as globalStore } from '../store.js';

/**
 * Retrieves all pinned items from the active profile's configuration.
 * @returns {Promise<Object>} A promise that resolves with the pinned items object.
 */
export async function getPinnedItems(store = globalStore) {
  const config = await store.getActiveConfig();
  const pinneds = config.formSkrining?.pinneds;
  return typeof pinneds === 'object' && pinneds !== null ? pinneds : {};
}

/**
 * Saves the pinned items object to the active profile's configuration.
 * @param {Object} items - The object containing all pinned items.
 * @returns {Promise<void>} A promise that resolves when saving is complete.
 */
export async function savePinnedItems(items, store = globalStore) {
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
export async function addPinnedItem(key, value, store = globalStore) {
  const items = await getPinnedItems();
  items[key] = value;
  await savePinnedItems(items);
}

/**
 * Removes a single pinned item.
 * @param {string} key - The key (data-name) of the item to remove.
 * @returns {Promise<void>}
 */
export async function removePinnedItem(key, store = globalStore) {
  const items = await getPinnedItems();
  delete items[key];
  await savePinnedItems(items);
}

/**
 * Checks if an item is already pinned.
 * @param {string} key - The key (data-name) of the item to check.
 * @returns {Promise<boolean>}
 */
export async function isPinned(key, store = globalStore) {
  const items = await getPinnedItems();
  return Object.prototype.hasOwnProperty.call(items, key);
}
