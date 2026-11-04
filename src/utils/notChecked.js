import { store as globalStore } from '../store.js';

/**
 * Resolves the profile key for one operation.
 * @param {import('../store.js').DandelionStore} store
 * @param {string|null} [profileKey]
 * @returns {Promise<string>}
 */
async function resolveProfileKey(store, profileKey) {
  if (profileKey) return profileKey;
  const config = await store.getFullConfig();
  return config.activeProfile;
}

/**
 * Retrieves the "Not Checked" master list for one profile.
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<string[]>} Array of row IDs.
 */
export async function getNotCheckedList(store = globalStore, profileKey = null) {
  const key = await resolveProfileKey(store, profileKey);
  const config = await store.getFullConfig();
  const listString = config.profiles?.[key]?.notChecked?.notCheckedList || '';

  return listString.split(';').filter(Boolean);
}

/**
 * Checks if a specific ID exists in the "Not Checked" master list.
 * @param {string} id - The row ID to check.
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<boolean>} True if the ID is in the list.
 */
export async function isInNotCheckedList(id, store = globalStore, profileKey = null) {
  const list = await getNotCheckedList(store, profileKey);
  return list.includes(id);
}

/**
 * Toggles an ID in the "Not Checked" master list (adds if missing, removes if present).
 * @param {string} id - The row ID to toggle.
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<boolean>} True if the ID was added.
 */
export async function toggleNotCheckedItem(id, store = globalStore, profileKey = null) {
  const key = await resolveProfileKey(store, profileKey);

  return await store.updateProfile(key, (profile) => {
    if (!profile.notChecked) profile.notChecked = {};

    const list = (profile.notChecked.notCheckedList || '').split(';').filter(Boolean);
    const index = list.indexOf(id);

    if (index > -1) {
      list.splice(index, 1);
      profile.notChecked.notCheckedList = list.join(';');
      return false;
    }

    list.push(id);
    profile.notChecked.notCheckedList = list.join(';');
    return true;
  });
}
