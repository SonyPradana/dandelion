import { store as globalStore } from '../store.js';

export async function getPinnedItems(store = globalStore) {
  const config = await store.getActiveConfig();
  const pinneds = config.formSkrining?.pinneds;
  return typeof pinneds === 'object' && pinneds !== null ? pinneds : {};
}

export async function savePinnedItems(items, store = globalStore) {
  const config = await store.getFullConfig();
  const activeProfile = config.activeProfile;

  if (config.profiles && config.profiles[activeProfile]) {
    if (!config.profiles[activeProfile].formSkrining) {
      config.profiles[activeProfile].formSkrining = {};
    }
    config.profiles[activeProfile].formSkrining.pinneds = items;
  }

  await store.setConfig(config);
}

export async function addPinnedItem(key, value, store = globalStore) {
  const items = await getPinnedItems(store);
  items[key] = value;
  await savePinnedItems(items, store);
}

export async function removePinnedItem(key, store = globalStore) {
  const items = await getPinnedItems(store);
  delete items[key];
  await savePinnedItems(items, store);
}

export async function isPinned(key, store = globalStore) {
  const items = await getPinnedItems(store);
  return Object.prototype.hasOwnProperty.call(items, key);
}
