import { store as globalStore } from '../store.js';

const STORAGE_KEY = 'flash_data_register_form';

/**
 * Persist register-form pinned field values (auto-timestamped).
 *
 * @param {Record<string, string>} data
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function setRegisterFormFlashData(data, store = globalStore) {
  data._timestamp = Date.now();
  await store.storageSet(STORAGE_KEY, data);
}

/**
 * Retrieve pinned flash data, or `null` when missing / expired.
 *
 * @param {number} [maxAge=600_000] max age in milliseconds
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<Record<string, string>|null>}
 */
export async function getRegisterFormFlashData(maxAge = 600_000, store = globalStore) {
  const data = await store.storageGet(STORAGE_KEY);
  if (data && data._timestamp && Date.now() - data._timestamp > maxAge) {
    await clearRegisterFormFlashData(store);
    return null;
  }
  return data;
}

/**
 * Remove pinned flash data from storage.
 *
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function clearRegisterFormFlashData(store = globalStore) {
  await store.storageRemove(STORAGE_KEY);
}

const LEGACY_STEP_KEY = 'flash_data_register_form_step';

/**
 * Remove the legacy pipeline checkpoint left by older versions.
 *
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function clearRegisterFormStep(store = globalStore) {
  await store.storageRemove(LEGACY_STEP_KEY);
}
