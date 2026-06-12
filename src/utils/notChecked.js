import { store } from '../store.js';

export async function getNotCheckedList() {
  const fullConfig = await store.getFullConfig();
  const activeProfileName = fullConfig.activeProfile;
  const listString = fullConfig.profiles[activeProfileName]?.notChecked?.notCheckedList || '';

  return listString.split(';').filter(Boolean);
}

async function saveNotCheckedList(listArray) {
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
 */
export async function isInNotCheckedList(id) {
  const list = await getNotCheckedList();
  return list.includes(id);
}

/**
 * Toggles an ID in the "Not Checked" master list (adds if missing, removes if present).
 * @param {string} id - The row ID to toggle.
 * @returns {Promise<boolean>} Resolves to the new presence state (true if added).
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
