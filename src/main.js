import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { initialize as initializeNotChecked } from './handlers/skrining-form-not-checked.js';
import { getAgreement, getActiveConfig } from './configuration.js';
import { validateChain } from './utils/productivityTracker.js';

getAgreement().then((agreed) => {
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
    if (config.notChecked?.url && currentURL.includes(config.notChecked.url)) {
      initializeNotChecked();
    } else if (config.formSkrining?.url && currentURL.includes(config.formSkrining.url)) {
      initializeSkriningForm();
    } else if (config.skrining?.url && currentURL.includes(config.skrining.url)) {
      initializeSkrining();
    }
  });
}
