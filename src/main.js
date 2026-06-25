import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkriningSend } from './handlers/skrining-send.js';
import { initializeSkrining } from './handlers/skrining.js';
import { initialize as initializeNotChecked } from './handlers/skrining-form-not-checked.js';
import { initializeRegisterForm } from './handlers/register-form.js';
import './handlers/skrining-events.js';
import browser from '@bridge/browser';
import { store } from './store.js';
import { getFlashDataIfEnabled } from './handlers/flashData.js';
import { validateChain, isDailyLimitReached } from './utils/productivityTracker.js';
import { init as quotaInit, isFeatureEnabled, isLimitReached } from './quota/quota-manager.js';
import { controlPanel } from './components/controlPanel.js';
import { notify } from './components/notification';

store.init(browser);

async function main() {
  const agreed = await store.getAgreement();
  if (!agreed) return;

  const config = await store.getFullConfig();
  notify.setConfig(config);
  controlPanel.setPosition(config.panelPosition || 'top-right');

  await quotaInit();

  const result = await validateChain();
  if (!result.valid) {
    console.warn('[Dandelion] Chain validation FAILED:', result.errors);
    return;
  }

  if ((await isDailyLimitReached()) || (await isLimitReached())) return;

  initialize();
}

main();

async function initialize() {
  const currentURL = window.location.href;
  const config = await store.getActiveConfig();

  const flashData = await getFlashDataIfEnabled();

  if (
    config.notChecked?.url &&
    currentURL.includes(config.notChecked.url) &&
    isFeatureEnabled('skrining-form-not-checked')
  ) {
    initializeNotChecked();
  } else if (
    config.formSkrining?.url &&
    currentURL.includes(config.formSkrining.url) &&
    isFeatureEnabled('skriningform')
  ) {
    initializeSkriningForm(flashData || {});
    if (isFeatureEnabled('skrining-send')) {
      initializeSkriningSend();
    }
  } else if (
    config.skrining?.url &&
    currentURL.includes(config.skrining.url) &&
    isFeatureEnabled('skrining')
  ) {
    initializeSkrining();
  } else if (
    config.registerForm?.url &&
    currentURL.includes(config.registerForm.url) &&
    isFeatureEnabled('registerForm')
  ) {
    initializeRegisterForm();
  }
}
