import { store as globalStore } from '../store.js';

const STORAGE_KEY = 'flash_data_register_form';

export async function setRegisterFormFlashData(data, store = globalStore) {
  data._timestamp = Date.now();
  await store.storageSet(STORAGE_KEY, data);
}

export async function getRegisterFormFlashData(maxAge = 600_000, store = globalStore) {
  const data = await store.storageGet(STORAGE_KEY);
  if (data && data._timestamp && Date.now() - data._timestamp > maxAge) {
    await clearRegisterFormFlashData(store);
    return null;
  }
  return data;
}

export async function clearRegisterFormFlashData(store = globalStore) {
  await store.storageRemove(STORAGE_KEY);
}
