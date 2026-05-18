import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { initialize as initializeNotChecked } from './handlers/skrining-form-not-checked.js';
import { getAgreement, getActiveConfig } from './configuration.js';
import { validateChain, isDailyLimitReached } from './utils/productivityTracker.js';
import { init as quotaInit, isFeatureEnabled } from './quota/quota-manager.js';

async function main() {
  const agreed = await getAgreement();
  if (!agreed) return;

  await quotaInit();

  const result = await validateChain();
  if (!result.valid) {
    console.warn('[Dandelion] Chain validation FAILED:', result.errors);
    return;
  }

  if (await isDailyLimitReached()) return;

  initialize();
}

main();

async function initialize() {
  const currentURL = window.location.href;
  const config = await getActiveConfig();

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
    initializeSkriningForm();
  } else if (
    config.skrining?.url &&
    currentURL.includes(config.skrining.url) &&
    isFeatureEnabled('skrining')
  ) {
    initializeSkrining();
  }
}
