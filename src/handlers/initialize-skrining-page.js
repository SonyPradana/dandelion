import { initializeSkriningForm } from './skriningform.js';
import { initializeSkriningSend } from './skrining-send.js';
import { initializeSkrining } from './skrining.js';
import { initialize as initializeNotChecked } from './skrining-form-not-checked.js';
import { store } from '../store.js';
import { isFeatureEnabled } from '../quota/quota-manager.js';
import { clearFlashData, REGISTER_FORM_SOURCE, isSkriningMandiri } from '../utils/flashSession.js';
import { bootstrapSkriningGate } from './skriningform/bootstrap-gate.js';
import { notify } from '../components/notification';
import { controlPanel } from '../components/controlPanel.js';

let initializedUrl = null;

/** @param {Record<string, any>} flashData */
async function runHandoffGate(flashData) {
  const gate = await bootstrapSkriningGate(flashData);
  if (gate === 'date-fallback') {
    notify.info(
      'Skrining Mandiri',
      'Tanggal pemeriksaan tidak bisa dipilih — memakai tanggal default',
      4000,
    );
  } else if (gate === 'no-modal' || gate === 'no-simpan') {
    console.warn(`[Dandelion] Skrining gate needs manual confirmation: ${gate}`);
  }
}

function removeRegisterFormButton() {
  controlPanel.remove('dandelion-register-form-btn');
}

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
    if (flashData?._source === REGISTER_FORM_SOURCE) await clearFlashData();
    return 'already';
  }

  const fromRegisterForm = flashData?._source === REGISTER_FORM_SOURCE;
  const shouldGate = fromRegisterForm && isSkriningMandiri(flashData);
  const url = window.location.href;
  const config = await store.getActiveConfig();

  if (
    config.notChecked?.url &&
    url.includes(config.notChecked.url) &&
    (isFeatureEnabled('zen-mode') || isFeatureEnabled('skrining-form-not-checked'))
  ) {
    removeRegisterFormButton();
    if (shouldGate) await runHandoffGate(flashData);
    initializeNotChecked();
    initializedUrl = url;
    return 'not-checked';
  }

  if (
    config.formSkrining?.url &&
    url.includes(config.formSkrining.url) &&
    isFeatureEnabled('skriningform')
  ) {
    removeRegisterFormButton();
    if (shouldGate) await runHandoffGate(flashData);
    const shouldAutoAssist = autoAssist && !fromRegisterForm;
    await initializeSkriningForm(flashData, undefined, { autoAssist: shouldAutoAssist });
    if (fromRegisterForm) await clearFlashData();
    if (isFeatureEnabled('skrining-send')) initializeSkriningSend();
    initializedUrl = url;
    return 'form-skrining';
  }

  if (config.skrining?.url && url.includes(config.skrining.url) && isFeatureEnabled('skrining')) {
    removeRegisterFormButton();
    initializeSkrining(config.skrining);
    initializedUrl = url;
    return 'skrining';
  }

  return null;
}
