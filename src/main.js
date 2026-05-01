import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { initialize as initializeNotChecked } from './handlers/skrining-form-not-checked.js';
import { getAgreement, getActiveConfig } from './configuration.js';

getAgreement().then((agreed) => {
  if (agreed) {
    initialize();
  }
});

function initialize() {
  const currentURL = window.location.href;

  getActiveConfig().then((config) => {
    const notCheckedPattern = config.notChecked?.url;

    if (notCheckedPattern && currentURL.includes(notCheckedPattern)) {
      initializeNotChecked();
    } else if (config.survey && currentURL.includes(config.survey)) {
      initializeSkriningForm();
    } else if (config.form && currentURL.includes(config.form)) {
      initializeSkrining();
    }
  });
}
