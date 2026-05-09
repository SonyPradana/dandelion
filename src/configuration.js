import browser from 'webextension-polyfill';

const DEFAULT_CONFIG = {
  activeProfile: 'profile1',
  profiles: {
    profile1: {
      formSkrining: { url: '', scrollToButton: true, radioButtonKeywords: '', dropdownKeywords: '', excludes: '', pinneds: {} },
      notChecked: { url: '', notCheckedList: '', automationDelay: 2000, itemDelay: 1000, reloadDelay: 1000, domTimeout: 5000 },
      skrining: { url: '' },
      zenMode: { domTimeout: 5000 },
    },
    profile2: {
      formSkrining: { url: '', scrollToButton: true, radioButtonKeywords: '', dropdownKeywords: '', excludes: '', pinneds: {} },
      notChecked: { url: '', notCheckedList: '', automationDelay: 2000, itemDelay: 1000, reloadDelay: 1000, domTimeout: 5000 },
      skrining: { url: '' },
      zenMode: { domTimeout: 5000 },
    },
  },
};

/**
 * @returns {Promise<boolean>}
 */
export function getAgreement() {
  return browser.storage.local.get('termsAgreed').then((result) => result?.termsAgreed ?? false);
}

/**
 * @param {boolean} value
 * @returns {void}
 */
export function setAgreement(value) {
  browser.storage.local.set({ termsAgreed: value });
}

/**
 * Migrates an old-format config to the new structure, or applies defaults for new format.
 * Detects old format by checking for root-level `formSelector` or per-profile `radioButtonKeywords`.
 * Does NOT write to storage.
 * @param {object} raw - Raw config object (old or new format)
 * @returns {typeof DEFAULT_CONFIG} Migrated config with defaults applied
 */
export function migrateConfig(raw) {
  const isOldFormat = raw.formSelector !== undefined || raw.profiles?.profile1?.radioButtonKeywords !== undefined;

  if (isOldFormat) {
    const profileKeys = Object.keys(raw.profiles || {});
    const profiles = {};

    for (const profileKey of profileKeys) {
      const oldProfile = raw.profiles[profileKey] || {};
      profiles[profileKey] = {
        formSkrining: {
          url: raw.surveySelector ?? '',
          scrollToButton: raw.scrollToBottom ?? true,
          radioButtonKeywords: oldProfile.radioButtonKeywords ?? '',
          dropdownKeywords: oldProfile.dropdownKeywords ?? '',
          excludes: oldProfile.excludes ?? '',
          pinneds: oldProfile.pinneds ?? {},
        },
        notChecked: {
          url: raw.notChecked?.url ?? '',
          notCheckedList: oldProfile.notCheckedList ?? '',
          automationDelay: raw.notChecked?.automationDelay ?? 2000,
          itemDelay: raw.notChecked?.itemDelay ?? 1000,
          reloadDelay: raw.notChecked?.reloadDelay ?? 1000,
          domTimeout: raw.notChecked?.domTimeout ?? 5000,
        },
        skrining: {
          url: raw.formSelector ?? '',
        },
        zenMode: {
          domTimeout: 5000,
        },
      };
    }

    return {
      activeProfile: raw.activeProfile ?? DEFAULT_CONFIG.activeProfile,
      profiles,
    };
  }

  return applyConfigDefaults(raw);
}

/**
 * Deep merges a new-format config with DEFAULT_CONFIG defaults.
 * Ensures all expected fields exist even if missing from stored config.
 * @param {object} raw
 * @returns {typeof DEFAULT_CONFIG}
 */
function applyConfigDefaults(raw) {
  const rawProfiles = raw.profiles || {};
  const allKeys = new Set([...Object.keys(DEFAULT_CONFIG.profiles), ...Object.keys(rawProfiles)]);
  const profiles = {};

  for (const key of allKeys) {
    const defaultProfile = DEFAULT_CONFIG.profiles[key] || {};
    const savedProfile = rawProfiles[key] || {};
    profiles[key] = {
      formSkrining: { ...defaultProfile.formSkrining, ...(savedProfile.formSkrining || {}) },
      notChecked: { ...defaultProfile.notChecked, ...(savedProfile.notChecked || {}) },
      skrining: { ...defaultProfile.skrining, ...(savedProfile.skrining || {}) },
      zenMode: { ...defaultProfile.zenMode, ...(savedProfile.zenMode || {}) },
    };
  }

  return {
    activeProfile: raw.activeProfile ?? DEFAULT_CONFIG.activeProfile,
    profiles,
  };
}

/**
 * Gets the full configuration object, including all profiles.
 * Supports migration from old format to new format automatically.
 * @returns {Promise<typeof DEFAULT_CONFIG>}
 */
export function getFullConfig() {
  return browser.storage.local.get(null).then((result) => {
    const isOldFormat = result.formSelector !== undefined || result.profiles?.profile1?.radioButtonKeywords !== undefined;
    const migrated = migrateConfig(result);

    if (isOldFormat) {
      setConfig(migrated);
    }

    return migrated;
  });
}

/**
 * Gets the configuration for the currently active profile.
 */
export function getActiveConfig() {
  return getFullConfig().then((config) => {
    const activeProfileSettings = config.profiles[config.activeProfile];
    return {
      formSkrining: activeProfileSettings.formSkrining,
      notChecked: activeProfileSettings.notChecked,
      skrining: activeProfileSettings.skrining,
      zenMode: activeProfileSettings.zenMode,
      activeProfile: config.activeProfile,
    };
  });
}

/**
 * Saves the full configuration object.
 * @param {typeof DEFAULT_CONFIG} config
 * @returns {void}
 */
export function setConfig(config) {
  browser.storage.local.set(config);
}

/**
 * Fast helper to switch active profile
 * @param {string} profileKey
 */
export async function setActiveProfile(profileKey) {
  const config = await getFullConfig();
  config.activeProfile = profileKey;
  await setConfig(config);
}
