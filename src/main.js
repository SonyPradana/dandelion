import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { initialize as initializeNotChecked } from './handlers/skrining-form-not-checked.js';
import { getAgreement, getActiveConfig } from './configuration.js';
import { validateChain } from './utils/productivityTracker.js';
import { init as licenseInit, getStatus, isFeatureEnabled } from './license/license-manager.js';

getAgreement().then(async (agreed) => {
  await licenseInit();
  if (agreed) {
    initialize();
  }
  validateChain().then((result) => {
    if (!result.valid) {
      console.warn('[Dandelion] Chain validation FAILED:', result.errors);
    } else {
      console.log(`[Dandelion] Chain OK: ${result.totalChecked} entries, 0 mismatches`);
    }
  });
});

function initialize() {
  const currentURL = window.location.href;

  getActiveConfig().then((config) => {
    if (
      currentURL.includes(config.notChecked?.url) &&
      isFeatureEnabled('skrining-form-not-checked')
    ) {
      initializeNotChecked();
    } else if (currentURL.includes(config.formSkrining?.url) && isFeatureEnabled('skriningform')) {
      initializeSkriningForm();
    } else if (currentURL.includes(config.skrining?.url) && isFeatureEnabled('skrining')) {
      initializeSkrining();
    }
  });
}
