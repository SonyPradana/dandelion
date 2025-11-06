import browser from 'webextension-polyfill';

/**
 * @returns {boolean}
 */
export function getAgreement () {
  return browser.storage.local
    .get('termsAgreed')
    .then((result) => result?.termsAgreed ?? false);
}

/**
 *
 * @param {boolean} value
 *
 * @returns {void}
 */
export function setAgreement (value) {
  browser.storage.local.set({ termsAgreed: value });
}
