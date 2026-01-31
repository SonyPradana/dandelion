import { getFullConfig, setConfig } from '../configuration.js';

/**
 * Retrieves the current active profile's excludes list as an array.
 * @returns {Promise<string[]>} A promise that resolves to an array of excluded data-names.
 */
async function getExcludesForActiveProfile () {
  const fullConfig = await getFullConfig();
  const activeProfileName = fullConfig.activeProfile;
  const excludesString = fullConfig.profiles[activeProfileName]?.excludes || '';
  // Filter(Boolean) removes any empty strings that might result from split (e.g., if string is ";item1" or "item1;")
  return excludesString.split(';').filter(Boolean);
}

/**
 * Saves the provided excludes array back to the active profile's configuration.
 * @param {string[]} excludesArray - The array of data-names to save as excludes.
 * @returns {Promise<void>}
 */
async function saveExcludesForActiveProfile (excludesArray) {
  const fullConfig = await getFullConfig();
  const activeProfileName = fullConfig.activeProfile;
  // Ensure the active profile exists before trying to set its excludes
  if (!fullConfig.profiles[activeProfileName]) {
    fullConfig.profiles[activeProfileName] = {};
  }
  fullConfig.profiles[activeProfileName].excludes = excludesArray.join(';');
  await setConfig(fullConfig);
}

/**
 * Checks if a specific data-name is currently excluded in the active profile.
 * @param {string} dataName - The data-name to check.
 * @returns {Promise<boolean>} True if excluded, false otherwise.
 */
export async function isExcluded (dataName) {
  const excludesList = await getExcludesForActiveProfile();
  return excludesList.includes(dataName);
}

/**
 * Toggles the exclusion status of a data-name in the active profile.
 * If the data-name is currently excluded, it will be removed.
 * If it's not excluded, it will be added.
 * @param {string} dataName - The data-name to toggle.
 * @returns {Promise<boolean>} True if the data-name is now excluded, false if it's now included.
 */
export async function toggleExclude (dataName) {
  const excludesList = await getExcludesForActiveProfile();
  const index = excludesList.indexOf(dataName);

  if (index > -1) {
    // It exists, so remove it
    excludesList.splice(index, 1);
    await saveExcludesForActiveProfile(excludesList);
    return false; // Now included
  } else {
    // It doesn't exist, so add it
    excludesList.push(dataName);
    await saveExcludesForActiveProfile(excludesList);
    return true; // Now excluded
  }
}
