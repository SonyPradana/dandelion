import browser from 'webextension-polyfill';

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
 * @returns {Promise<{form: string, survey: string, radioButtonKeywords: string, dropdownKeywords: string}>}
 */
export function getConfig () {
  return browser.storage.local.get(['formSelector', 'surveySelector', 'radioButtonKeywordsSelector', 'dropdownKeywordsSelector']).then((result) => {
    return {
      form: result?.formSelector ?? '',
      survey: result?.surveySelector ?? '',
      radioButtonKeywords: result?.radioButtonKeywordsSelector ?? '',
      dropdownKeywords: result?.dropdownKeywordsSelector ?? '',
    };
  });
}

/**
 * @param {{form: string, survey: string, radioButtonKeywords: string, dropdownKeywords: string}} config
 * @returns {void}
 */
export function setConfig (config) {
  browser.storage.local.set({
    formSelector: config.form,
    surveySelector: config.survey,
    radioButtonKeywordsSelector: config.radioButtonKeywords,
    dropdownKeywordsSelector: config.dropdownKeywords
  });
}
