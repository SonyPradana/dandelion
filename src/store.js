import { migrateConfig } from './configuration';

const TERMS_KEY = 'dandelion_terms';
const STORAGE_KEYS = {
  TERMS: 'dandelion_terms',
  FLASH_DATA: 'flash_data',
  ZEN_MODE: 'dandelion_zen_mode_state',
  PRODUCTIVITY: 'productivity_stats',
  DEVICE_ID: 'device_id',
  QUOTA_TOKEN: 'dandelion_quota_token',
  CACHE: 'license-cache',
};

class DandelionStore {
  _backend = null;

  init(backend) {
    this._backend = backend;
  }

  get _browser() {
    if (!this._backend) {
      throw new Error('DandelionStore not initialized. Call store.init(backend) first.');
    }
    return this._backend;
  }

  // -- Raw storage access for custom keys (handlers etc) --

  async storageGet(key) {
    const result = await this._browser.storage.local.get(key);
    return result[key] ?? null;
  }

  async storageGetMany(keys) {
    return await this._browser.storage.local.get(keys);
  }

  async storageSet(key, value) {
    await this._browser.storage.local.set({ [key]: value });
  }

  async storageSetMany(data) {
    await this._browser.storage.local.set(data);
  }

  async storageRemove(key) {
    await this._browser.storage.local.remove(key);
  }

  async storageRemoveMany(keys) {
    await this._browser.storage.local.remove(keys);
  }

  // -- Config & Agreement --

  async getAgreement() {
    const result = await this._browser.storage.local.get(TERMS_KEY);
    const data = result[TERMS_KEY];
    if (!data || !data.agreed) return false;
    return data.version === this._browser.runtime.getManifest().version;
  }

  async setAgreement(value) {
    if (value) {
      await this._browser.storage.local.set({
        [TERMS_KEY]: { agreed: true, version: this._browser.runtime.getManifest().version },
      });
    } else {
      await this._browser.storage.local.set({ [TERMS_KEY]: { agreed: false } });
    }
  }

  async getFullConfig() {
    const result = await this._browser.storage.local.get(null);
    const isOldFormat =
      result.formSelector !== undefined ||
      result.profiles?.profile1?.radioButtonKeywords !== undefined;
    const migrated = migrateConfig(result);

    if (isOldFormat) {
      await this.setConfig(migrated);
      await this._browser.storage.local.remove([
        'formSelector',
        'surveySelector',
        'scrollToBottom',
        'notChecked',
      ]);
    }

    return migrated;
  }

  async getActiveConfig() {
    const config = await this.getFullConfig();
    const activeProfileSettings = config.profiles[config.activeProfile];
    return {
      formSkrining: activeProfileSettings.formSkrining,
      notChecked: activeProfileSettings.notChecked,
      skrining: activeProfileSettings.skrining,
      zenMode: activeProfileSettings.zenMode,
      flashData: activeProfileSettings.flashData,
      activeProfile: config.activeProfile,
    };
  }

  async setConfig(config) {
    await this._browser.storage.local.set(config);
  }

  async setActiveProfile(profileKey) {
    const config = await this.getFullConfig();
    config.activeProfile = profileKey;
    await this.setConfig(config);
  }

  // -- Flash Session --

  async getFlashData() {
    const result = await this._browser.storage.local.get(STORAGE_KEYS.FLASH_DATA);
    return result[STORAGE_KEYS.FLASH_DATA] || null;
  }

  async setFlashData(data) {
    await this._browser.storage.local.set({ [STORAGE_KEYS.FLASH_DATA]: data });
  }

  async clearFlashData() {
    await this._browser.storage.local.remove(STORAGE_KEYS.FLASH_DATA);
  }

  // -- Zen Mode --

  async getZenModeState() {
    const result = await this._browser.storage.local.get(STORAGE_KEYS.ZEN_MODE);
    return result[STORAGE_KEYS.ZEN_MODE] || { active: false, queue: [], total: 0 };
  }

  async setZenModeState(state) {
    await this._browser.storage.local.set({ [STORAGE_KEYS.ZEN_MODE]: state });
  }

  async clearZenMode() {
    await this._browser.storage.local.remove(STORAGE_KEYS.ZEN_MODE);
  }

  // -- Productivity --

  async loadProductivityData() {
    try {
      const result = await this._browser.storage.local.get(STORAGE_KEYS.PRODUCTIVITY);
      return result[STORAGE_KEYS.PRODUCTIVITY] || {};
    } catch {
      return {};
    }
  }

  async saveProductivityData(data) {
    await this._browser.storage.local.set({ [STORAGE_KEYS.PRODUCTIVITY]: data });
  }

  // -- Quota --

  async getDeviceId() {
    const result = await this._browser.storage.local.get(STORAGE_KEYS.DEVICE_ID);
    return result[STORAGE_KEYS.DEVICE_ID] || null;
  }

  async setDeviceId(id) {
    await this._browser.storage.local.set({ [STORAGE_KEYS.DEVICE_ID]: id });
  }

  async getQuotaToken() {
    try {
      const result = await this._browser.storage.local.get(STORAGE_KEYS.QUOTA_TOKEN);
      return result[STORAGE_KEYS.QUOTA_TOKEN] || null;
    } catch {
      return null;
    }
  }

  async saveQuotaToken(jwt) {
    await this._browser.storage.local.set({ [STORAGE_KEYS.QUOTA_TOKEN]: jwt });
  }

  async removeQuotaToken() {
    await this._browser.storage.local.remove(STORAGE_KEYS.QUOTA_TOKEN);
  }

  async getCache() {
    try {
      const result = await this._browser.storage.local.get(STORAGE_KEYS.CACHE);
      const cache = result[STORAGE_KEYS.CACHE];
      if (!cache || typeof cache.cachedAt !== 'number') return null;
      if (Date.now() - cache.cachedAt > 8 * 60 * 60 * 1000) {
        await this.clearCache();
        return null;
      }
      return cache;
    } catch {
      return null;
    }
  }

  async setCache(data) {
    await this._browser.storage.local.set({
      [STORAGE_KEYS.CACHE]: { ...data, cachedAt: Date.now() },
    });
  }

  async clearCache() {
    await this._browser.storage.local.remove(STORAGE_KEYS.CACHE);
  }

  getManifestVersion() {
    return this._browser.runtime.getManifest().version;
  }
}

export const store = new DandelionStore();
export default store;

// Named exports for backward compatibility
export const getAgreement = (...a) => store.getAgreement(...a);
export const setAgreement = (...a) => store.setAgreement(...a);
export const getFullConfig = (...a) => store.getFullConfig(...a);
export const getActiveConfig = (...a) => store.getActiveConfig(...a);
export const setConfig = (...a) => store.setConfig(...a);
export const setActiveProfile = (...a) => store.setActiveProfile(...a);
export const getFlashData = (...a) => store.getFlashData(...a);
export const setFlashData = (...a) => store.setFlashData(...a);
export const clearFlashData = (...a) => store.clearFlashData(...a);
export const getZenModeState = (...a) => store.getZenModeState(...a);
export const setZenModeState = (...a) => store.setZenModeState(...a);
export const clearZenMode = (...a) => store.clearZenMode(...a);
export const loadProductivityData = (...a) => store.loadProductivityData(...a);
export const saveProductivityData = (...a) => store.saveProductivityData(...a);
export const getDeviceId = (...a) => store.getDeviceId(...a);
export const setDeviceId = (...a) => store.setDeviceId(...a);
export const getQuotaToken = (...a) => store.getQuotaToken(...a);
export const saveQuotaToken = (...a) => store.saveQuotaToken(...a);
export const removeQuotaToken = (...a) => store.removeQuotaToken(...a);
export const getCache = (...a) => store.getCache(...a);
export const setCache = (...a) => store.setCache(...a);
export const clearCache = (...a) => store.clearCache(...a);
