import { initializeSkriningForm } from './handlers/skriningform.js';
import { initializeSkrining } from './handlers/skrining.js';
import { initialize as initializeNotChecked } from './handlers/skrining-form-not-checked.js';
import { configManager } from './configuration.js';

configManager.load().then(() => {
  if (configManager.getAgreement()) {
    initialize();
  }
});

function initialize() {
  const currentURL = window.location.href;
  const config = configManager.getActiveConfig();

  const notCheckedPattern = config.notChecked?.url;

  if (notCheckedPattern && currentURL.includes(notCheckedPattern)) {
    initializeNotChecked(config);
  } else if (config.survey && currentURL.includes(config.survey)) {
    initializeSkriningForm(config);
  } else if (config.form && currentURL.includes(config.form)) {
    initializeSkrining(config);
  }
}
