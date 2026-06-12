const DEFAULT_CONFIG = {
  activeProfile: 'profile1',
  panelPosition: 'top-right',
  silenceInfoNotification: false,
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
      zenMode: { domTimeout: 5000, enabled: false, timeout: 5000 },
      flashData: { enabled: false },
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
      zenMode: { domTimeout: 5000, enabled: false, timeout: 5000 },
      flashData: { enabled: false },
    },
  },
};

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
          enabled: false,
          timeout: 5000,
        },
        flashData: { enabled: false },
      };
    }

    return {
      activeProfile: raw.activeProfile ?? DEFAULT_CONFIG.activeProfile,
      panelPosition: DEFAULT_CONFIG.panelPosition,
      silenceInfoNotification: DEFAULT_CONFIG.silenceInfoNotification,
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
      flashData: { ...defaultProfile.flashData, ...(savedProfile.flashData || {}) },
    };
  }

  return {
    activeProfile: raw.activeProfile ?? DEFAULT_CONFIG.activeProfile,
    panelPosition: raw.panelPosition ?? DEFAULT_CONFIG.panelPosition,
    silenceInfoNotification: raw.silenceInfoNotification ?? DEFAULT_CONFIG.silenceInfoNotification,
    profiles,
  };
}

// -- Backward-compatible re-exports from store --
// These will be removed in a future cleanup after all imports are migrated.
export {
  getAgreement,
  setAgreement,
  getFullConfig,
  getActiveConfig,
  setConfig,
  setActiveProfile,
} from './store';
