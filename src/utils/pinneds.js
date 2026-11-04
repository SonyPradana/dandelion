import { store as globalStore } from '../store.js';

/**
 * Retrieves all pinned items from the active profile's configuration.
 * @returns {Promise<Object>} A promise that resolves with the pinned items object.
 * @param {import('../store.js').DandelionStore} [store]
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
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function savePinnedItems(items, store = globalStore) {
  const config = await store.getFullConfig();
  await store.updateProfile(config.activeProfile, (profile) => {
    if (!profile.formSkrining) profile.formSkrining = {};
    profile.formSkrining.pinneds = items;
  });
}

/**
 * Reads and mutates the active profile's pinned items under the write lock.
 * @param {(items: Object) => void} mutate
 * @param {import('../store.js').DandelionStore} store
 * @returns {Promise<void>}
 */
async function mutatePinnedItems(mutate, store) {
  const config = await store.getFullConfig();
  await store.updateProfile(config.activeProfile, (profile) => {
    if (!profile.formSkrining) profile.formSkrining = {};
    const pinneds = profile.formSkrining.pinneds;
    if (typeof pinneds !== 'object' || pinneds === null) {
      profile.formSkrining.pinneds = {};
    }
    mutate(profile.formSkrining.pinneds);
  });
}

/**
 * Adds or updates a single pinned item.
 * @param {string} key - The key (data-name) of the item.
 * @param {string} value - The value (text) of the item.
 * @returns {Promise<void>}
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function addPinnedItem(key, value, store = globalStore) {
  await mutatePinnedItems((items) => {
    items[key] = value;
  }, store);
}

/**
 * Removes a single pinned item.
 * @param {string} key - The key (data-name) of the item to remove.
 * @returns {Promise<void>}
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function removePinnedItem(key, store = globalStore) {
  await mutatePinnedItems((items) => {
    delete items[key];
  }, store);
}

/**
 * Checks if an item is already pinned.
 * @param {string} key - The key (data-name) of the item to check.
 * @returns {Promise<boolean>}
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function isPinned(key, store = globalStore) {
  const items = await getPinnedItems(store);
  return Object.prototype.hasOwnProperty.call(items, key);
}
