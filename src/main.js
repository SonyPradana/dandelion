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
import { refreshButton } from './components/refreshButton.js';

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

  mountRefreshButton();
  initialize();
}

main();

/** Mount the refresh control over the panel and rebuild handlers on click. */
function mountRefreshButton() {
  controlPanel.init();
  const btn = refreshButton();
  controlPanel.panel.appendChild(btn);
  controlPanel.applyPosition();

  let refreshing = false;
  btn.addEventListener('click', async () => {
    if (refreshing) return;
    refreshing = true;
    try {
      const config = await store.refreshConfig();
      controlPanel.setPosition(config.panelPosition || 'top-right');
      controlPanel.clear();
      document
        .querySelectorAll('.dandelion-debug-marker, .dandelion-row-marker')
        .forEach((el) => el.remove());
      await initialize({ refresh: true });
    } finally {
      refreshing = false;
    }
  });
}

/** Route the current page to the matching skrining or register-form initializer. */
async function initialize({ refresh = false } = {}) {
  const currentURL = window.location.href;
  const config = await store.getActiveConfig();

  const flashData = refresh ? {} : await getFlashDataIfEnabled();

  if (await initializeSkriningPage(flashData || {}, { autoAssist: !refresh, force: refresh })) {
    return;
  }

  if (
    config.registerForm?.url &&
    currentURL.includes(config.registerForm.url) &&
    isFeatureEnabled('registerForm')
  ) {
    initializeRegisterForm(config.registerForm);
  }
}
