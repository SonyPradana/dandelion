import { store } from '../store';
import { isFeatureEnabled } from '../quota/quota-manager';
import { debugButton } from '../components/debugButton';
import { zenModeButton } from '../components/zenModeButton';
import { zeroButton } from '../components/zeroButton';
import { createRowMarker } from '../components/rowMarker';
import { updateStatusPanel, removeStatusPanel } from '../components/statusPanel';
import { getNotCheckedList } from '../utils/notChecked';
import { isZenModeActive, isZenRunning, clearZenMode } from '../utils/zenMode';
import { startZenAutomation, initializeZenMode } from './zen-mode';
import { startZeroAutomation, initializeZeroMode, isZeroRunning } from './zero-mode';
import { controlPanel } from '../components/controlPanel';
import { createProfileSwitcher } from '../components/profile';
import { isPageInProcessingState, getQueueStats } from './inspection/not-checked-utils';

/**
 * Mounts the list-page control panel: profile indicator, the bee helper toggle
 * that marks the "Not Checked" list, and the Zen/Zero Mode buttons.
 */

const ROW_MARKER_CLASS = 'dandelion-row-marker';
let profileSwitcher = null;
let monitorGeneration = 0;

/**
 * Initializes the Not-Checked handler and starts the page state monitor.
 */
export function initialize() {
  startStateMonitor();
  if (isFeatureEnabled('zen-mode')) {
    initializeZenMode();
    initializeZeroMode();
  }
}

/**
 * Periodically monitors the page state to manage button visibility and resume pending tasks.
 */
function startStateMonitor() {
  const generation = ++monitorGeneration;
  let isPolling = false;

  async function poll() {
    if (isPolling || generation !== monitorGeneration) return;
    isPolling = true;

    try {
      const isProcessing = isPageInProcessingState();

      await ensureButtonsMounted(isProcessing);
    } finally {
      isPolling = false;
      if (generation === monitorGeneration) setTimeout(poll, 2000);
    }
  }

  poll();
}

/**
 * Manages the presence of automation control buttons based on the current page state.
 * @param {boolean} isProcessing - Indicates if the page is in an active examination state.
 */
async function ensureButtonsMounted(isProcessing) {
  let debugBtn = document.getElementById('dandelion-debug-toggle');
  let zenBtn = document.getElementById('dandelion-zen-mode-toggle');
  let profileTrigger = document.getElementById('dandelion-profile-toggle');
  let profileDropdown = document.getElementById('dandelion-profile-switcher');
  let zeroBtn = document.getElementById('dandelion-zero-toggle');

  if (!isProcessing) {
    if (profileSwitcher) {
      profileSwitcher.close();
      profileSwitcher = null;
    }
    if (zeroBtn) controlPanel.remove(zeroBtn);
    if (debugBtn) controlPanel.remove(debugBtn);
    if (zenBtn) controlPanel.remove(zenBtn);
    if (profileTrigger) controlPanel.remove(profileTrigger);
    if (profileDropdown) controlPanel.remove(profileDropdown);

    const zenActive = await isZenModeActive();
    if (!zenActive) removeStatusPanel();
    return;
  }

  const [zenActive, zeroActive] = await Promise.all([isZenModeActive(), isZeroRunning()]);

  const zenEnabled = isFeatureEnabled('zen-mode');

  if (!profileTrigger || !profileDropdown) {
    if (profileSwitcher) profileSwitcher.close();
    if (profileTrigger) controlPanel.remove(profileTrigger);
    if (profileDropdown) controlPanel.remove(profileDropdown);

    const cfg = await store.getFullConfig();
    profileSwitcher = createProfileSwitcher({
      profiles: cfg.profiles,
      activeProfile: cfg.activeProfile,
      onSwitch: (pKey) => store.onProfileSwitch(pKey),
    });
    profileTrigger = profileSwitcher.trigger;
    profileDropdown = profileSwitcher.dropdown;
  }

  if (zenEnabled && !zeroBtn) {
    zeroBtn = zeroButton(false);

    zeroBtn.addEventListener('click', async () => {
      if (await isZenRunning()) return;

      if (await isZeroRunning()) {
        await clearZenMode();
        return;
      }

      startZeroAutomation();
    });

    controlPanel.mount(zeroBtn, 1);
  }

  controlPanel.mount(profileTrigger, 4);
  controlPanel.mount(profileDropdown, 4);

  if (zenEnabled && !zenBtn) {
    zenBtn = zenModeButton(zenActive);
    if (zenBtn) {
      zenBtn.addEventListener('click', async () => {
        if (await isZeroRunning()) return;

        if (await isZenModeActive()) {
          await clearZenMode();
        } else {
          startZenAutomation();
        }
      });
      controlPanel.mount(zenBtn, 2);
    }
  }

  if (!debugBtn) {
    debugBtn = debugButton();
    if (debugBtn) {
      debugBtn.addEventListener('click', async () => {
        if (await isZenModeActive()) return;
        await toggleHelperMode();
      });
      controlPanel.mount(debugBtn, 2);
    }
  }

  if (zenActive || zeroActive) {
    updateUIForRunningState(debugBtn, zenBtn, zeroBtn, { zenActive, zeroActive });
  } else {
    restoreUIState(debugBtn, zenBtn, zeroBtn);
  }
}

/**
 * Restores buttons to their normal active state.
 * @param {HTMLElement} debugBtn
 * @param {HTMLElement} zenBtn
 * @param {HTMLElement} zeroBtn
 */
function restoreUIState(debugBtn, zenBtn, zeroBtn) {
  [debugBtn, zenBtn, zeroBtn].forEach((btn) => btn?.reset?.());
  document.querySelectorAll(`.${ROW_MARKER_CLASS}`).forEach((m) => {
    m.classList.remove('dandelion-dimmed');
  });
}

/**
 * Updates button appearance and disables interactions while automation is running.
 * @param {HTMLElement} debugBtn - The debug/helper mode toggle button.
 * @param {HTMLElement} zenBtn - The zen mode toggle button.
 * @param {HTMLElement} zeroBtn - The zero mode toggle button.
 * @param {Object} state - Running state flags.
 * @param {boolean} state.zenActive - Zen Mode is active.
 * @param {boolean} state.zeroActive - Zero Mode is active.
 */
function updateUIForRunningState(debugBtn, zenBtn, zeroBtn, state) {
  const { zenActive, zeroActive } = state;

  if (zenActive) {
    if (debugBtn) debugBtn.setDimmed(true);
    if (zenBtn) zenBtn.setActive(true);
    if (zeroBtn) zeroBtn.setDimmed(true);
  }

  // Zero borrows zen-mode state, so when Zero is running it takes precedence
  // over the mirrored zen session: the untoken zen button is dimmed, not active.
  if (zeroActive) {
    if (debugBtn) debugBtn.setDimmed(true);
    if (zenBtn) {
      zenBtn.setDimmed(true);
      zenBtn.setActive(false);
    }
    if (zeroBtn) zeroBtn.setActive(true);
  }

  document.querySelectorAll(`.${ROW_MARKER_CLASS}`).forEach((m) => {
    m.classList.add('dandelion-dimmed');
  });
}

/**
 * Toggles the helper mode which displays markers on all available rows.
 */
async function toggleHelperMode() {
  const existingMarkers = document.querySelectorAll(`.${ROW_MARKER_CLASS}`);

  if (existingMarkers.length > 0) {
    existingMarkers.forEach((m) => m.remove());
    removeStatusPanel();
    return;
  }

  const masterList = await getNotCheckedList();
  const stats = getQueueStats(masterList);

  updateStatusPanel(stats.doneIds.length, stats.foundIds.length, 'Mode Debug Aktif 🐞', {
    title: 'Info Debug',
  });

  const rowIdElements = document.querySelectorAll('[id^="rowfrm"],[id^="row-FRM"]');
  rowIdElements.forEach((el) => {
    const gridRow = el.closest('.grid');
    if (!gridRow) return;

    const titleColumn = gridRow.querySelector('div:first-child');
    if (!titleColumn) return;

    if (window.getComputedStyle(titleColumn).position === 'static') {
      titleColumn.style.position = 'relative';
    }

    titleColumn.appendChild(createRowMarker(el.id));
  });
}
