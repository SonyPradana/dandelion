import { getFullConfig, setConfig } from '../configuration.js';

/**
 * Retrieves the current active profile's notCheckedList as an array.
 * @returns {Promise<string[]>}
 */
export async function getNotCheckedList() {
  const fullConfig = await getFullConfig();
  const activeProfileName = fullConfig.activeProfile;
  const listString = fullConfig.profiles[activeProfileName]?.notCheckedList || '';

  return listString.split(';').filter(Boolean);
}

/**
 * Saves the provided array back to the active profile's notCheckedList.
 * @param {string[]} listArray
 * @returns {Promise<void>}
 */
async function saveNotCheckedList(listArray) {
  const fullConfig = await getFullConfig();
  const activeProfileName = fullConfig.activeProfile;

  if (!fullConfig.profiles[activeProfileName]) {
    fullConfig.profiles[activeProfileName] = {};
  }

  fullConfig.profiles[activeProfileName].notCheckedList = listArray.join(';');
  await setConfig(fullConfig);
}

/**
 * Checks if an ID is in the notCheckedList.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function isInNotCheckedList(id) {
  const list = await getNotCheckedList();
  return list.includes(id);
}

/**
 * Toggles an ID in the notCheckedList.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function toggleNotCheckedItem(id) {
  const list = await getNotCheckedList();
  const index = list.indexOf(id);

  if (index > -1) {
    list.splice(index, 1);
    await saveNotCheckedList(list);
    return false;
  } else {
    list.push(id);
    await saveNotCheckedList(list);
    return true;
  }
}
