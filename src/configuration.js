import browser from 'webextension-polyfill';

const DEFAULT_CONFIG = {
  formSelector: '',
  surveySelector: '',
  notChecked: {
    url: '',
    automationDelay: 2000,
    itemDelay: 1000,
    reloadDelay: 1000,
    domTimeout: 5000,
  },
  activeProfile: 'profile1',
  scrollToBottom: true,
  profiles: {
    profile1: {
      radioButtonKeywords: '',
      dropdownKeywords: '',
      excludes: '',
      notCheckedList: '',
      pinneds: {},
    },
    profile2: {
      radioButtonKeywords: '',
      dropdownKeywords: '',
      excludes: '',
      notCheckedList: '',
      pinneds: {},
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
 * Gets the full configuration object, including all profiles.
 * @returns {Promise<typeof DEFAULT_CONFIG>}
 */
export function getFullConfig() {
  return browser.storage.local.get(Object.keys(DEFAULT_CONFIG)).then((result) => {
    // Deep merge with defaults for global objects
    const notChecked = {
      ...DEFAULT_CONFIG.notChecked,
      ...(result.notChecked || {}),
    };

    // Deep merge for profiles
    const profiles = {
      ...DEFAULT_CONFIG.profiles,
      ...(result.profiles || {}),
    };
    profiles.profile1 = { ...DEFAULT_CONFIG.profiles.profile1, ...(profiles.profile1 || {}) };
    profiles.profile2 = { ...DEFAULT_CONFIG.profiles.profile2, ...(profiles.profile2 || {}) };

    return {
      formSelector: result.formSelector ?? DEFAULT_CONFIG.formSelector,
      surveySelector: result.surveySelector ?? DEFAULT_CONFIG.surveySelector,
      notChecked,
      activeProfile: result.activeProfile ?? DEFAULT_CONFIG.activeProfile,
      scrollToBottom: result.scrollToBottom ?? DEFAULT_CONFIG.scrollToBottom,
      profiles,
    };
  });
}

/**
 * Gets the configuration for the currently active profile.
 */
export function getActiveConfig() {
  return getFullConfig().then((config) => {
    const activeProfileSettings = config.profiles[config.activeProfile];
    return {
      form: config.formSelector,
      survey: config.surveySelector,
      notChecked: config.notChecked, // Grouped object
      scrollToBottom: config.scrollToBottom,
      ...activeProfileSettings,
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
