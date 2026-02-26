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
      pinneds: {},
    },
    profile2: {
      radioButtonKeywords: '',
      dropdownKeywords: '',
      excludes: '',
      pinneds: {},
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

/**
 * Records a time-based event (load or click).
 * @param {'load' | 'click'} type
 * @returns {Promise<void>}
 */
export async function recordEvent (type) {
  const data = await browser.storage.local.get('stats');
  const stats = data.stats || { load: [], click: [] };

  if (!stats[type]) stats[type] = [];

  stats[type].push(Date.now());

  // Cleanup: Keep only last 30 days of data to save storage
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  stats[type] = stats[type].filter(ts => ts > thirtyDaysAgo);

  await browser.storage.local.set({ stats });
}

/**
 * Gets statistics for total and today.
 * @returns {Promise<{
 *   totalLoad: number,
 *   totalClick: number,
 *   todayLoad: number,
 *   todayClick: number,
 *   limit: number
 * }>}
 */
export async function getStats () {
  const data = await browser.storage.local.get('stats');
  const stats = data.stats || { load: [], click: [] };

  const todayStart = new Date().setHours(0, 0, 0, 0);

  const countToday = (arr) => arr.filter(ts => ts >= todayStart).length;

  return {
    totalLoad: stats.load.length,
    totalClick: stats.click.length,
    todayLoad: countToday(stats.load),
    todayClick: countToday(stats.click),
    limit: parseInt(process.env.DAILY_LIMIT || '100', 10)
  };
}

/**
 * Checks if the daily click limit has been reached.
 * @returns {Promise<boolean>}
 */
export async function isLimitReached () {
  const stats = await getStats();
  return stats.todayClick >= stats.limit;
}
