import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { getAgreement, getActiveConfig } from './configuration.js';

getAgreement().then((agreed) => {
  if (agreed) {
    console.log('Dandelion is active.');
    initializeForm();
  }
});

function initializeForm () {
  getActiveConfig().then((config) => {
    const currentURL = window.location.href;

    if (currentURL.includes(config.survey)) {
      initializeSkriningForm();
    } else if (currentURL.includes(config.form)) {
      initializeSkrining();
    }
  });
}
