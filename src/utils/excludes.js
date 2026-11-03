import { store as globalStore } from '../store.js';

/**
 * Resolves the profile key for one operation. The key is read once, so a
 * profile switch between the read and the write cannot move the write.
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
 * Retrieves one profile's excludes list as an array.
 * @param {import('../store.js').DandelionStore} store
 * @param {string|null} [profileKey]
 * @returns {Promise<string[]>} A promise that resolves to an array of excluded data-names.
 */
async function getExcludesForProfile(store, profileKey) {
  const key = await resolveProfileKey(store, profileKey);
  const config = await store.getFullConfig();
  return (config.profiles?.[key]?.formSkrining?.excludes || '').split(';').filter(Boolean);
}

/**
 * Checks if a specific data-name is currently excluded in one profile.
 * @param {string} dataName - The data-name to check.
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<boolean>} True if excluded, false otherwise.
 */
export async function isExcluded(dataName, store = globalStore, profileKey = null) {
  const excludesList = await getExcludesForProfile(store, profileKey);

  return excludesList.includes(dataName);
}

/**
 * Toggles the exclusion status of a data-name in one profile.
 * @param {string} dataName - The data-name to toggle.
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<boolean>} True if the data-name is now excluded, false if it's now included.
 */
export async function toggleExclude(dataName, store = globalStore, profileKey = null) {
  const key = await resolveProfileKey(store, profileKey);

  return await store.updateProfile(key, (profile) => {
    if (!profile.formSkrining) profile.formSkrining = {};

    const excludesList = (profile.formSkrining.excludes || '').split(';').filter(Boolean);
    const index = excludesList.indexOf(dataName);

    if (index > -1) {
      excludesList.splice(index, 1);
      profile.formSkrining.excludes = excludesList.join(';');
      return false;
    }

    excludesList.push(dataName);
    profile.formSkrining.excludes = excludesList.join(';');
    return true;
  });
}
