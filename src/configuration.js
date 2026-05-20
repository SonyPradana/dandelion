import browser from 'webextension-polyfill';

const DEFAULT_CONFIG = {
  activeProfile: 'profile1',
  profiles: {
    profile1: {
      name: 'Profile 1',
      formSkrining: {
        url: '',
        scrollToButton: true,
        radioButtonKeywords: '',
        dropdownKeywords: '',
        excludes: '',
        pinneds: {},
      },
      notChecked: {
        url: '',
        notCheckedList: '',
        automationDelay: 2000,
        itemDelay: 1000,
        reloadDelay: 1000,
        domTimeout: 5000,
      },
      skrining: { url: '' },
      zenMode: { domTimeout: 5000 },
    },
    profile2: {
      name: 'Profile 2',
      formSkrining: {
        url: '',
        scrollToButton: true,
        radioButtonKeywords: '',
        dropdownKeywords: '',
        excludes: '',
        pinneds: {},
      },
      notChecked: {
        url: '',
        notCheckedList: '',
        automationDelay: 2000,
        itemDelay: 1000,
        reloadDelay: 1000,
        domTimeout: 5000,
      },
      skrining: { url: '' },
      zenMode: { domTimeout: 5000 },
    },
  },
};

const TERMS_KEY = 'dandelion_terms';

/**
 * @returns {Promise<boolean>}
 */
export function getAgreement() {
  return browser.storage.local.get(TERMS_KEY).then((result) => {
    const data = result[TERMS_KEY];
    if (!data || !data.agreed) return false;
    return data.version === browser.runtime.getManifest().version;
  });
}

/**
 * @param {boolean} value
 * @returns {void}
 */
export function setAgreement(value) {
  if (value) {
    browser.storage.local.set({
      [TERMS_KEY]: { agreed: true, version: browser.runtime.getManifest().version },
    });
  } else {
    browser.storage.local.set({ [TERMS_KEY]: { agreed: false } });
  }
}

/**
 * Migrates an old-format config to the new structure, or applies defaults for new format.
 * Detects old format by checking for root-level `formSelector` or per-profile `radioButtonKeywords`.
 * Does NOT write to storage.
 * @param {object} raw - Raw config object (old or new format)
 * @returns {typeof DEFAULT_CONFIG} Migrated config with defaults applied
 */
export function migrateConfig(raw) {
  const isOldFormat =
    raw.formSelector !== undefined || raw.profiles?.profile1?.radioButtonKeywords !== undefined;

  if (isOldFormat) {
    const profileKeys = Object.keys(raw.profiles || {});
    const profiles = {};

    for (const profileKey of profileKeys) {
      const oldProfile = raw.profiles[profileKey] || {};
      const defaultName = { profile1: 'Profile 1', profile2: 'Profile 2' }[profileKey] || '';
      profiles[profileKey] = {
        name: oldProfile.name || defaultName,
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
      name: savedProfile.name || defaultProfile.name || '',
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
    const isOldFormat =
      result.formSelector !== undefined ||
      result.profiles?.profile1?.radioButtonKeywords !== undefined;
    const migrated = migrateConfig(result);

    if (isOldFormat) {
      setConfig(migrated);
      browser.storage.local.remove([
        'formSelector',
        'surveySelector',
        'scrollToBottom',
        'notChecked',
      ]);
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
