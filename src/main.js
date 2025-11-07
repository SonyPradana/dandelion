import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { getAgreement, getConfig } from './configuration.js';

getAgreement().then((agreed) => {
  if (agreed) {
    console.log('Dandelion is active.');
    initializeForm();
  }
});

function initializeForm () {
  getConfig().then((config) => {
    const currentURL = window.location.href;

    if (currentURL.includes(config.survey)) {
      initializeSkriningForm();
    } else if (currentURL.includes(config.form)) {
      initializeSkrining();
    }
  });
}
