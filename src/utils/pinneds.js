/**
 * Retrieves all pinned items from a profile configuration.
 * @param {Object} profileConfig - The active profile configuration.
 * @returns {Object}
 */
export function getPinnedItems(profileConfig) {
  return typeof profileConfig?.pinneds === 'object' && profileConfig.pinneds !== null
    ? { ...profileConfig.pinneds }
    : {};
}

/**
 * Logic to add or update a pinned item. Returns updated pinneds object.
 * @param {string} key - The key (data-name) of the item.
 * @param {string} value - The value (text) of the item.
 * @param {Object} currentPinneds - The current pinned items object.
 * @returns {Object} Updated pinneds object.
 */
export function addPinnedItemLogic(key, value, currentPinneds = {}) {
  return { ...currentPinneds, [key]: value };
}

/**
 * Logic to remove a pinned item. Returns updated pinneds object.
 * @param {string} key - The key to remove.
 * @param {Object} currentPinneds - The current pinned items object.
 * @returns {Object} Updated pinneds object.
 */
export function removePinnedItemLogic(key, currentPinneds = {}) {
  const newPinneds = { ...currentPinneds };
  delete newPinneds[key];
  return newPinneds;
}

/**
 * Checks if an item is already pinned.
 * @param {string} key - The key to check.
 * @param {Object} profileConfig - The active profile configuration.
 * @returns {boolean}
 */
export function isPinned(key, profileConfig) {
  const items = getPinnedItems(profileConfig);
  return Object.prototype.hasOwnProperty.call(items, key);
}
