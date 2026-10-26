import { initializeSkriningForm } from './skriningform.js';
import { initializeSkriningSend } from './skrining-send.js';
import { initializeSkrining } from './skrining.js';
import { initialize as initializeNotChecked } from './skrining-form-not-checked.js';
import { store } from '../store.js';
import { isFeatureEnabled } from '../quota/quota-manager.js';
import { clearFlashData } from '../utils/flashSession.js';
import { bootstrapSkriningGate } from './skriningform/bootstrap-gate.js';

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
  const initialUrl = window.location.href;
  if (initializedUrl === initialUrl) {
    if (flashData?._source === 'register-form') await clearFlashData();
    return 'already';
  }

  const fromRegisterForm = flashData?._source === 'register-form';
  const redirectAllowed =
    flashData?.['skrining mandiri'] === true || flashData?.['skrining mandiri'] === 'true';
  if (fromRegisterForm && redirectAllowed && isFeatureEnabled('skriningform')) {
    await bootstrapSkriningGate(flashData);
  }

  const url = window.location.href;
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
    const shouldAutoAssist = autoAssist && !fromRegisterForm;
    await initializeSkriningForm(flashData, undefined, { autoAssist: shouldAutoAssist });
    if (fromRegisterForm) await clearFlashData();
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
