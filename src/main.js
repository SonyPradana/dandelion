import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { initialize as initializeNotChecked } from './handlers/skrining-form-not-checked.js';
import { getAgreement, getActiveConfig } from './configuration.js';

getAgreement().then((agreed) => {
  console.log('Dandelion Agreement Status:', agreed);
  if (agreed) {
    console.log('Dandelion is active.');
    initializeForm();
  } else {
    console.warn('Dandelion Agreement not yet accepted. Please open the popup.');
  }
});

function initializeForm() {
  const currentURL = window.location.href;
  console.log('Current URL:', currentURL);

  getActiveConfig().then((config) => {
    console.log('Active Config Loaded:', config);

    const notCheckedPattern = config.notChecked?.url;

    if (notCheckedPattern && currentURL.includes(notCheckedPattern)) {
      console.log('Matching Detail Pemeriksaan page...');
      initializeNotChecked();
    } else if (config.survey && currentURL.includes(config.survey)) {
      console.log('Matching Survey page...');
      initializeSkriningForm();
    } else if (config.form && currentURL.includes(config.form)) {
      console.log('Matching Form page...');
      initializeSkrining();
    }
  });
}
