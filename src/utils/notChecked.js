import { store as globalStore } from '../store.js';

/**
 * Retrieves the "Not Checked" master list for the currently active profile.
 * @returns {Promise<string[]>} A promise that resolves to an array of row IDs.
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function getNotCheckedList(store = globalStore) {
  const fullConfig = await store.getFullConfig();
  const activeProfileName = fullConfig.activeProfile;
  const listString = fullConfig.profiles[activeProfileName]?.notChecked?.notCheckedList || '';

  return listString.split(';').filter(Boolean);
}

/**
 * Saves the "Not Checked" master list back to the active profile's configuration.
 * @param {string[]} listArray - The array of row IDs to save.
 * @returns {Promise<void>}
 * @param {import('../store.js').DandelionStore} [store]
 */
async function saveNotCheckedList(listArray, store = globalStore) {
  const fullConfig = await store.getFullConfig();
  const activeProfileName = fullConfig.activeProfile;

  if (!fullConfig.profiles[activeProfileName]) {
    fullConfig.profiles[activeProfileName] = {};
  }
  if (!fullConfig.profiles[activeProfileName].notChecked) {
    fullConfig.profiles[activeProfileName].notChecked = {};
  }

  fullConfig.profiles[activeProfileName].notChecked.notCheckedList = listArray.join(';');
  await store.setConfig(fullConfig);
}

/**
 * Checks if a specific ID exists in the "Not Checked" master list.
 * @param {string} id - The row ID to check.
 * @returns {Promise<boolean>} Resolves to true if the ID is in the list.
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function isInNotCheckedList(id, store = globalStore) {
  const list = await getNotCheckedList(store);
  return list.includes(id);
}

/**
 * Toggles an ID in the "Not Checked" master list (adds if missing, removes if present).
 * @param {string} id - The row ID to toggle.
 * @returns {Promise<boolean>} Resolves to the new presence state (true if added).
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function toggleNotCheckedItem(id, store = globalStore) {
  const list = await getNotCheckedList(store);
  const index = list.indexOf(id);

  if (index > -1) {
    list.splice(index, 1);
    await saveNotCheckedList(list, store);
    return false;
  } else {
    list.push(id);
    await saveNotCheckedList(list, store);
    return true;
  }
}
