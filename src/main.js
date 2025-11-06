import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { getAgreement } from './configuration.js';

getAgreement().then((agreed) => {
  if (agreed) {
    console.log('Dandelion is active.');
    initializeForm();
  }
});

function initializeForm () {
  const currentURL = window.location.href;

  if (currentURL.includes('form.')) {
    initializeSkriningForm();
  } else if (currentURL.includes('webskrining.')) {
    initializeSkrining();
  }
}
