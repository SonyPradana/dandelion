import browser from 'webextension-polyfill';

const DEFAULT_CONFIG = {
  formSelector: '',
  surveySelector: '',
  notChecked: {
    url: '',
    automationDelay: 2000,
    itemDelay: 1000,
    reloadDelay: 3000,
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

class ConfigManager {
  data = null;
  termsAgreed = false;

  /**
   * Loads configuration from storage and merges with defaults.
   * @returns {Promise<Object>} The full configuration object.
   */
  async load() {
    const keys = ['termsAgreed', ...Object.keys(DEFAULT_CONFIG)];
    const result = await browser.storage.local.get(keys);

    this.termsAgreed = result.termsAgreed ?? false;

    // Deep merge for nested objects
    const notChecked = {
      ...DEFAULT_CONFIG.notChecked,
      ...(result.notChecked || {}),
    };

    const profiles = {
      ...DEFAULT_CONFIG.profiles,
      ...(result.profiles || {}),
    };
    
    // Ensure all profiles are merged with their defaults
    Object.keys(profiles).forEach((key) => {
      const defaultProfile = DEFAULT_CONFIG.profiles[key] || {};
      profiles[key] = { ...defaultProfile, ...(profiles[key] || {}) };
    });

    this.data = {
      formSelector: result.formSelector ?? DEFAULT_CONFIG.formSelector,
      surveySelector: result.surveySelector ?? DEFAULT_CONFIG.surveySelector,
      notChecked,
      activeProfile: result.activeProfile ?? DEFAULT_CONFIG.activeProfile,
      scrollToBottom: result.scrollToBottom ?? DEFAULT_CONFIG.scrollToBottom,
      profiles,
    };

    return this.data;
  }

  /**
   * Gets the configuration for the currently active profile.
   * @returns {Object}
   */
  getActiveConfig() {
    if (!this.data) return null;
    const activeProfileSettings = this.data.profiles[this.data.activeProfile];
    return {
      form: this.data.formSelector,
      survey: this.data.surveySelector,
      notChecked: this.data.notChecked,
      scrollToBottom: this.data.scrollToBottom,
      ...activeProfileSettings,
    };
  }

  /**
   * Saves the current memory state back to storage.
   * @returns {Promise<void>}
   */
  async sync() {
    if (!this.data) return;
    await browser.storage.local.set({
      termsAgreed: this.termsAgreed,
      ...this.data,
    });
  }

  /**
   * Updates the full configuration object in memory and syncs it.
   * @param {Object} newData 
   */
  async setFullConfig(newData) {
    this.data = { ...newData };
    await this.sync();
  }

  /**
   * Updates agreement state.
   * @param {boolean} agreed 
   */
  async setAgreement(agreed) {
    this.termsAgreed = agreed;
    await browser.storage.local.set({ termsAgreed: agreed });
  }

  getAgreement() {
    return this.termsAgreed;
  }
}

// Export a singleton instance
export const configManager = new ConfigManager();
