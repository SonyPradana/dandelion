import browser from 'webextension-polyfill';
import { button } from '../components/button';
import { debugButton } from '../components/debugButton';
import { zenModeButton } from '../components/zenModeButton';
import { createRowMarker } from '../components/rowMarker';
import { updateStatusPanel, removeStatusPanel } from '../components/statusPanel';
import { getNotCheckedList } from '../utils/notChecked';
import { getFullConfig, getActiveConfig } from '../configuration';
import { isZenModeActive, clearZenMode } from '../utils/zenMode';
import { startZenAutomation, initializeZenMode } from './zen-mode';
import { controlPanel } from '../components/controlPanel';
import { notify } from '../components/notification';
import { createProfileComponent } from '../components/profile';
import {
  isPageInProcessingState,
  getQueueStats,
  waitForRow,
  waitForElement,
  clickFinishServiceButton,
  hasRemainingForms,
} from './inspection/not-checked-utils';
import bus from '../utils/hooks';

/**
 * Automates clicking the "Not Checked" confirmation buttons for a list of rows.
 */

const STORAGE_KEY = 'dandelion_pending_not_checked';
const TOTAL_KEY = 'dandelion_total_not_checked';
const ROW_MARKER_CLASS = 'dandelion-row-marker';

let isStandardAutomationActive = false;

/**
 * Initializes the Not-Checked handler and starts the page state monitor.
 */
export function initialize() {
  startStateMonitor();
  initializeZenMode();
}

/**
 * Periodically monitors the page state to manage button visibility and resume pending tasks.
 */
function startStateMonitor() {
  let isPolling = false;

  async function poll() {
    if (isPolling) return;
    isPolling = true;

    try {
      const isProcessing = isPageInProcessingState();

      await ensureButtonsMounted(isProcessing);

      const storage = await browser.storage.local.get([STORAGE_KEY]);
      const pendingData = storage[STORAGE_KEY];

      if (pendingData) {
        const ids = JSON.parse(pendingData);

        if (ids.length === 0) {
          await finishAutomation();
          await ensureButtonsMounted(isPageInProcessingState());
        }

        if (isProcessing && !isStandardAutomationActive) {
          isStandardAutomationActive = true;
          await resumeAutomation();
        }
      }
    } finally {
      isPolling = false;
      setTimeout(poll, 2000);
    }
  }

  poll();
}

/**
 * Manages the presence of automation control buttons based on the current page state.
 * @param {boolean} isProcessing - Indicates if the page is in an active examination state.
 */
async function ensureButtonsMounted(isProcessing) {
  let mainBtn = document.getElementById('dandelion-not-checked-automation');
  let debugBtn = document.getElementById('dandelion-debug-toggle');
  let zenBtn = document.getElementById('dandelion-zen-mode-toggle');
  let profileIndicator = document.getElementById('dandelion-profile-indicator');

  if (!isProcessing) {
    if (mainBtn) controlPanel.remove(mainBtn);
    if (debugBtn) controlPanel.remove(debugBtn);
    if (zenBtn) controlPanel.remove(zenBtn);
    if (profileIndicator) controlPanel.remove(profileIndicator);

    if (!isStandardAutomationActive) {
      const [pendingResult, zenActive] = await Promise.all([
        browser.storage.local.get([STORAGE_KEY]),
        isZenModeActive(),
      ]);
      const hasPending = pendingResult[STORAGE_KEY] !== undefined;
      if (!hasPending && !zenActive) removeStatusPanel();
    }
    return;
  }

  const [pendingResult, zenActive] = await Promise.all([
    browser.storage.local.get([STORAGE_KEY]),
    isZenModeActive(),
  ]);
  const hasPending = pendingResult[STORAGE_KEY] !== undefined;
  const isRunningLocally = hasPending;

  if (!mainBtn) {
    mainBtn = button('dandelion-not-checked-automation');
    if (mainBtn) {
      if (!profileIndicator) {
        const cfg = await getFullConfig();
        profileIndicator = createProfileComponent({
          profiles: cfg.profiles,
          activeProfile: cfg.activeProfile,
        });
      }

      let hideTimeout = null;
      const showProfile = () => {
        if (hideTimeout) clearTimeout(hideTimeout);
        profileIndicator.setVisibility(true);
      };
      const hideProfile = () => {
        hideTimeout = setTimeout(() => profileIndicator.setVisibility(false), 300);
      };

      mainBtn.addEventListener('mouseenter', showProfile);
      mainBtn.addEventListener('mouseleave', hideProfile);
      profileIndicator.addEventListener('mouseenter', showProfile);
      profileIndicator.addEventListener('mouseleave', hideProfile);

      mainBtn.addEventListener('click', async () => {
        if (isStandardAutomationActive || (await isZenModeActive())) return;

        const storageClick = await browser.storage.local.get([STORAGE_KEY]);
        const pending = storageClick[STORAGE_KEY];

        if (pending && JSON.parse(pending).length > 0) {
          if (
            await notify.confirm('Antrian Pending', 'Ada antrian yang belum selesai. Lanjutkan?')
          ) {
            isStandardAutomationActive = true;
            await resumeAutomation();
            return;
          }
        }

        const masterList = await getNotCheckedList();
        if (masterList.length === 0) {
          await notify.alert(
            'Daftar Kosong',
            'Daftar target kosong. Gunakan fitur 🐞 untuk menandai baris.',
          );
          return;
        }

        const stats = getQueueStats(masterList);
        if (stats.pendingIds.length === 0) {
          await notify.alert(
            'Analisa Progres',
            `Analisa: ${stats.foundIds.length} item ditemukan, semuanya sudah selesai.`,
          );
          return;
        }

        if (
          await notify.confirm(
            'Mulai Otomasi',
            `Mulai proses untuk ${stats.pendingIds.length} item yang terpilih?`,
          )
        ) {
          await startAutomation(stats.pendingIds, stats.foundIds.length);
        }
      });
      controlPanel.mount(mainBtn, 1);
      controlPanel.mount(profileIndicator, 4);
    }
  }

  if (!zenBtn) {
    zenBtn = zenModeButton(zenActive);
    if (zenBtn) {
      zenBtn.addEventListener('click', async () => {
        if (isStandardAutomationActive) return;

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
        if (isStandardAutomationActive || (await isZenModeActive())) return;
        await toggleHelperMode();
      });
      controlPanel.mount(debugBtn, 2);
    }
  }

  if (isRunningLocally || zenActive) {
    await updateUIForRunningState(mainBtn, debugBtn, zenBtn, isRunningLocally, zenActive);
  } else {
    restoreUIState(mainBtn, debugBtn, zenBtn);
  }
}

/**
 * Restores buttons to their normal active state.
 * @param {HTMLElement} mainBtn
 * @param {HTMLElement} debugBtn
 * @param {HTMLElement} zenBtn
 */
function restoreUIState(mainBtn, debugBtn, zenBtn) {
  [mainBtn, debugBtn, zenBtn].forEach((btn) => btn?.reset?.());
  document.querySelectorAll(`.${ROW_MARKER_CLASS}`).forEach((m) => {
    m.classList.remove('dandelion-dimmed');
  });
}

/**
 * Updates button appearance and disables interactions while automation is running.
 * @param {HTMLElement} mainBtn - The primary automation button.
 * @param {HTMLElement} debugBtn - The debug/helper mode toggle button.
 * @param {HTMLElement} zenBtn - The zen mode toggle button.
 * @param {boolean} isRunningLocally - Not Checked automation is active.
 * @param {boolean} zenActive - Zen Mode is active.
 */
async function updateUIForRunningState(mainBtn, debugBtn, zenBtn, isRunningLocally, zenActive) {
  if (isRunningLocally) {
    if (mainBtn) mainBtn.setRunning(true);
    if (debugBtn) debugBtn.setDimmed(true);
    if (zenBtn) zenBtn.setDimmed(true);
  }

  if (zenActive) {
    if (mainBtn) mainBtn.setDimmed(true);
    if (debugBtn) debugBtn.setDimmed(true);
    if (zenBtn) zenBtn.setActive(true);
  }

  document.querySelectorAll(`.${ROW_MARKER_CLASS}`).forEach((m) => {
    m.classList.add('dandelion-dimmed');
  });

  if (isRunningLocally) await syncStatusPanel();
}

/**
 * Updates the on-screen progress panel with current task statistics.
 */
async function syncStatusPanel() {
  const storage = await browser.storage.local.get([STORAGE_KEY, TOTAL_KEY]);
  const pending = JSON.parse(storage[STORAGE_KEY] || '[]');
  const totalFoundOnPage = parseInt(storage[TOTAL_KEY] || '0');
  const doneCount = Math.max(0, totalFoundOnPage - pending.length);

  updateStatusPanel(doneCount, totalFoundOnPage, pending.length > 0, {
    onDelete: async () => {
      await browser.storage.local.remove([STORAGE_KEY, TOTAL_KEY]);
      isStandardAutomationActive = false;
      window.location.reload();
    },
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
    onDelete: async () => {
      await browser.storage.local.remove([STORAGE_KEY, TOTAL_KEY]);
      isStandardAutomationActive = false;
      window.location.reload();
    },
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

/**
 * Prepares and starts the automation for the given list of IDs.
 * @param {string[]} pendingIds - Array of row IDs to process.
 * @param {number} totalFoundOnPage - Total number of relevant IDs found on the page.
 */
async function startAutomation(pendingIds, totalFoundOnPage) {
  isStandardAutomationActive = true;
  const config = await getActiveConfig();
  await browser.storage.local.set({
    [STORAGE_KEY]: JSON.stringify(pendingIds),
    [TOTAL_KEY]: totalFoundOnPage.toString(),
  });
  await syncStatusPanel();

  const delay = config.notChecked?.itemDelay || 1000;
  setTimeout(processNextItem, delay);
}

/**
 * Resumes an existing automation session from storage.
 */
async function resumeAutomation() {
  const storage = await browser.storage.local.get([STORAGE_KEY]);
  const pending = storage[STORAGE_KEY];

  if (pending) {
    const ids = JSON.parse(pending);
    if (ids.length > 0) {
      const config = await getActiveConfig();
      const delay = config.notChecked?.automationDelay || 2000;
      setTimeout(processNextItem, delay);
    } else {
      await finishAutomation();
    }
  }
}

/**
 * Performs cleanup of storage and resets UI state when automation completes.
 * Called by startStateMonitor after reload detects ids.length === 0.
 */
async function finishAutomation() {
  await browser.storage.local.remove([STORAGE_KEY, TOTAL_KEY]);
  isStandardAutomationActive = false;

  removeStatusPanel();
  notify.info('Selesai', 'Seluruh tugas telah diproses ✓', 5000);

  if (!await hasRemainingForms() && await notify.confirm('Konfirmasi', 'Selesaikan Layanan?')) {
    clickFinishServiceButton();
  }

  const mainBtn = document.getElementById('dandelion-not-checked-automation');
  const debugBtn = document.getElementById('dandelion-debug-toggle');
  const zenBtn = document.getElementById('dandelion-zen-mode-toggle');

  [mainBtn, debugBtn, zenBtn].forEach((btn) => btn?.reset?.());

  document.querySelectorAll(`.${ROW_MARKER_CLASS}`).forEach((m) => {
    m.style.opacity = '1';
    m.style.pointerEvents = 'auto';
  });
}

/**
 * Processes the next item in the pending queue by clicking its label and handling confirmation.
 */
async function processNextItem() {
  const storage = await browser.storage.local.get([STORAGE_KEY]);
  const pendingStr = storage[STORAGE_KEY];

  if (!pendingStr) {
    isStandardAutomationActive = false;
    return;
  }

  const ids = JSON.parse(pendingStr);
  if (ids.length === 0) {
    await finishAutomation();
    return;
  }

  const config = await getActiveConfig();
  const ncConfig = config.notChecked || {};

  const currentId = ids[0];
  const domTimeout = ncConfig.domTimeout || 5000;
  const rowElement = await waitForRow(currentId, domTimeout);

  if (rowElement) {
    const row = rowElement.closest('.grid');
    if (!row) {
      await moveToNext(ids, ncConfig.itemDelay);
      return;
    }
    const rowText = row.textContent;
    const label = row.querySelector('label');
    if (rowText.includes('Tidak diperiksa') || rowText.includes('Selesai diperiksa')) {
      await moveToNext(ids, ncConfig.itemDelay);
      return;
    }
    if (!label) {
      await moveToNext(ids, ncConfig.itemDelay);
      return;
    }

    row.style.backgroundColor = '#fff3e5';
    label.click();

    try {
      const confirmBtn = await waitForElement('button', 'Tidak Periksa', 6000);
      await moveToNext(ids, false);
      confirmBtn.click();
      bus.emit('notChecked:didProcessItem');

      setTimeout(() => {
        window.location.reload();
      }, ncConfig.reloadDelay || 1000);
    } catch (error) {
      setTimeout(processNextItem, ncConfig.itemDelay || 1000);
    }
  } else {
    const masterList = await getNotCheckedList();
    const stats = getQueueStats(masterList);

    if (stats.pendingIds.length === 0) {
      await finishAutomation();
    } else {
      await browser.storage.local.set({
        [STORAGE_KEY]: JSON.stringify(stats.pendingIds),
        [TOTAL_KEY]: stats.foundIds.length.toString(),
      });
      setTimeout(processNextItem, ncConfig.itemDelay);
    }
  }
}

/**
 * Moves to the next item in the queue after a specified delay.
 * @param {string[]} ids - The updated list of pending IDs.
 * @param {number|boolean} delay - Delay in milliseconds before next process, or false to skip automatic call.
 */
async function moveToNext(ids, delay) {
  ids.shift();
  await browser.storage.local.set({ [STORAGE_KEY]: JSON.stringify(ids) });

  if (delay !== false) {
    await syncStatusPanel();
  }
  if (typeof delay === 'number') {
    setTimeout(processNextItem, delay);
  }
}
