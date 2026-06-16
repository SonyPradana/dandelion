import { store as globalStore } from '../store.js';

export async function getNotCheckedList(store = globalStore) {
  const fullConfig = await store.getFullConfig();
  const activeProfileName = fullConfig.activeProfile;
  const listString = fullConfig.profiles[activeProfileName]?.notChecked?.notCheckedList || '';

  return listString.split(';').filter(Boolean);
}

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

export async function isInNotCheckedList(id, store = globalStore) {
  const list = await getNotCheckedList(store);
  return list.includes(id);
}

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
