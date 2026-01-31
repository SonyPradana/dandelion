import browser from 'webextension-polyfill';

const DEFAULT_CONFIG = {
  formSelector: '',
  surveySelector: '',
  activeProfile: 'profile1',
  profiles: {
    profile1: {
      radioButtonKeywords: '',
      dropdownKeywords: '',
      excludes: '',
    },
    profile2: {
      radioButtonKeywords: '',
      dropdownKeywords: '',
      excludes: '',
    }
  }
};

/**
 * @returns {Promise<boolean>}
 */
export function getAgreement () {
  return browser.storage.local
    .get('termsAgreed')
    .then((result) => result?.termsAgreed ?? false);
}

/**
 * @param {boolean} value
 * @returns {void}
 */
export function setAgreement (value) {
  browser.storage.local.set({ termsAgreed: value });
}

/**
 * Gets the full configuration object, including all profiles.
 * @returns {Promise<typeof DEFAULT_CONFIG>}
 */
export function getFullConfig () {
  return browser.storage.local.get(Object.keys(DEFAULT_CONFIG)).then((result) => {
    // Deep merge with defaults to ensure all keys are present
    const profiles = {
      ...DEFAULT_CONFIG.profiles,
      ...(result.profiles || {})
    };
    profiles.profile1 = { ...DEFAULT_CONFIG.profiles.profile1, ...(profiles.profile1 || {}) };
    profiles.profile2 = { ...DEFAULT_CONFIG.profiles.profile2, ...(profiles.profile2 || {}) };

    return {
      formSelector: result.formSelector ?? DEFAULT_CONFIG.formSelector,
      surveySelector: result.surveySelector ?? DEFAULT_CONFIG.surveySelector,
      activeProfile: result.activeProfile ?? DEFAULT_CONFIG.activeProfile,
      profiles
    };
  });
}

/**
 * Gets the configuration for the currently active profile.
 * @returns {Promise<{form: string, survey: string, radioButtonKeywords: string, dropdownKeywords: string}>}
 */
export function getActiveConfig () {
  return getFullConfig().then(config => {
    const activeProfileSettings = config.profiles[config.activeProfile];
    return {
      form: config.formSelector,
      survey: config.surveySelector,
      ...activeProfileSettings
    };
  });
}

/**
 * Saves the full configuration object.
 * @param {typeof DEFAULT_CONFIG} config
 * @returns {void}
 */
export function setConfig (config) {
  browser.storage.local.set(config);
}
