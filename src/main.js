import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';

initializeForm();

function initializeForm () {
  const currentURL = window.location.href;

  if (currentURL.includes(process.env.SITE_SURVEY)) {
    initializeSkriningForm();
  } else if (currentURL.includes(process.env.SITE_SKRINING)) {
    initializeSkrining();
  }
}
