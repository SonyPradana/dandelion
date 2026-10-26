import { initializeSkriningForm } from './skriningform.js';
import { initializeSkriningSend } from './skrining-send.js';
import { initializeSkrining } from './skrining.js';
import { initialize as initializeNotChecked } from './skrining-form-not-checked.js';
import { store } from '../store.js';
import { isFeatureEnabled } from '../quota/quota-manager.js';

let initializedUrl = null;

/**
 * Mount the initial panel for whichever skrining page is currently open.
 * Returns the matched page, or `null` when the URL matches none.
 *
 * @param {Object} [flashData]
 * @param {{ autoAssist?: boolean }} [options]
 * @returns {Promise<'not-checked'|'form-skrining'|'skrining'|'already'|null>}
 */
export async function initializeSkriningPage(flashData = {}, { autoAssist = true } = {}) {
  const url = window.location.href;
  if (initializedUrl === url) return 'already';

  const config = await store.getActiveConfig();

  if (
    config.notChecked?.url &&
    url.includes(config.notChecked.url) &&
    (isFeatureEnabled('zen-mode') || isFeatureEnabled('skrining-form-not-checked'))
  ) {
    initializeNotChecked();
    initializedUrl = url;
    return 'not-checked';
  }

  if (
    config.formSkrining?.url &&
    url.includes(config.formSkrining.url) &&
    isFeatureEnabled('skriningform')
  ) {
    const shouldAutoAssist = autoAssist && flashData?._source !== 'register-form';
    await initializeSkriningForm(flashData, undefined, { autoAssist: shouldAutoAssist });
    if (isFeatureEnabled('skrining-send')) initializeSkriningSend();
    initializedUrl = url;
    return 'form-skrining';
  }

  if (config.skrining?.url && url.includes(config.skrining.url) && isFeatureEnabled('skrining')) {
    initializeSkrining(config.skrining);
    initializedUrl = url;
    return 'skrining';
  }

  return null;
}
