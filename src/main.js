import { initializeRegisterForm } from './handlers/register-form.js';
import { initializeSkriningPage } from './handlers/initialize-skrining-page.js';
import './handlers/skrining-events.js';
import browser from '@bridge/browser';
import { store } from './store.js';
import { getFlashDataIfEnabled } from './handlers/flashData.js';
import { validateChain, isDailyLimitReached } from './utils/productivityTracker.js';
import { init as quotaInit, isFeatureEnabled, isLimitReached } from './quota/quota-manager.js';
import { controlPanel } from './components/controlPanel.js';
import { notify } from './components/notification';
import { initializeShareToken, isShareTokenUrl } from './handlers/shareToken.js';

store.init(browser);

/** Boot the content script after agreement, config, quota, and chain checks. */
async function main() {
  const agreed = await store.getAgreement();
  if (!agreed) return;

  const config = await store.getFullConfig();
  notify.setConfig(config);
  controlPanel.setPosition(config.panelPosition || 'top-right');

  await quotaInit();

  if (isShareTokenUrl(window.location.href)) {
    initializeShareToken();
    return;
  }

  const result = await validateChain();
  if (!result.valid) {
    console.warn('[Dandelion] Chain validation FAILED:', result.errors);
    return;
  }

  if ((await isDailyLimitReached()) || (await isLimitReached())) return;

  initialize();
}

main();

/** Route the current page to the matching skrining or register-form initializer. */
async function initialize() {
  const currentURL = window.location.href;
  const config = await store.getActiveConfig();

  const flashData = await getFlashDataIfEnabled();

  if (await initializeSkriningPage(flashData || {})) return;

  if (
    config.registerForm?.url &&
    currentURL.includes(config.registerForm.url) &&
    isFeatureEnabled('registerForm')
  ) {
    initializeRegisterForm(config.registerForm);
  }
}
