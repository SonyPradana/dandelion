import { getActiveConfig, getFullConfig, setConfig } from '../configuration.js';

/**
 * Retrieves all pinned items from the active profile's configuration.
 * @returns {Promise<Object>} A promise that resolves with the pinned items object.
 */
export async function getPinnedItems () {
  const config = await getActiveConfig();
  return typeof config.pinneds === 'object' && config.pinneds !== null
    ? config.pinneds
    : {};
}

/**
 * Saves the pinned items object to the active profile's configuration.
 * @param {Object} items - The object containing all pinned items.
 * @returns {Promise<void>} A promise that resolves when saving is complete.
 */
export async function savePinnedItems (items) {
  const config = await getFullConfig();
  const activeProfile = config.activeProfile;

  if (config.profiles && config.profiles[activeProfile]) {
    config.profiles[activeProfile].pinneds = items;
  }

  await setConfig(config);
}

/**
 * Adds or updates a single pinned item.
 * @param {string} key - The key (data-name) of the item.
 * @param {string} value - The value (text) of the item.
 * @returns {Promise<void>}
 */
export async function addPinnedItem (key, value) {
  const items = await getPinnedItems();
  items[key] = value;
  await savePinnedItems(items);
}

/**
 * Removes a single pinned item.
 * @param {string} key - The key (data-name) of the item to remove.
 * @returns {Promise<void>}
 */
export async function removePinnedItem (key) {
  const items = await getPinnedItems();
  delete items[key];
  await savePinnedItems(items);
}

/**
 * Checks if an item is already pinned.
 * @param {string} key - The key (data-name) of the item to check.
 * @returns {Promise<boolean>}
 */
export async function isPinned (key) {
  const items = await getPinnedItems();
  return Object.prototype.hasOwnProperty.call(items, key);
}
