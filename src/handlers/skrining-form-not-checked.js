import { button } from '../components/button';
import { debugButton } from '../components/debugButton';
import { zenModeButton } from '../components/zenModeButton';
import { createRowMarker } from '../components/rowMarker';
import { updateStatusPanel, removeStatusPanel } from '../components/statusPanel';
import { getNotCheckedList } from '../utils/notChecked';
import { getActiveConfig } from '../configuration';
import {
  isPageInProcessingState,
  getQueueStats,
  waitForRow,
  waitForElement,
} from './inspection/not-checked-utils';

/**
 * Automates clicking the "Not Checked" confirmation buttons for a list of rows.
 */

const STORAGE_KEY = 'dandelion_pending_not_checked';
const TOTAL_KEY = 'dandelion_total_not_checked';
const ROW_MARKER_CLASS = 'dandelion-row-marker';

let isAutomationActive = false;

/**
 * Initializes the Not-Checked handler and starts the page state monitor.
 */
export function initialize() {
  startStateMonitor();
}

/**
 * Periodically monitors the page state to manage button visibility and resume pending tasks.
 */
function startStateMonitor() {
  setInterval(() => {
    const isProcessing = isPageInProcessingState();

    ensureButtonsMounted(isProcessing);

    const pendingData = localStorage.getItem(STORAGE_KEY);
    if (pendingData) {
      const ids = JSON.parse(pendingData);

      if (ids.length === 0) {
        finishAutomation();
        return;
      }

      if (isProcessing && !isAutomationActive) {
        isAutomationActive = true;
        resumeAutomation();
      }
    }
  }, 2000);
}

/**
 * Manages the presence of automation control buttons based on the current page state.
 * @param {boolean} isProcessing - Indicates if the page is in an active examination state.
 */
function ensureButtonsMounted(isProcessing) {
  let mainBtn = document.getElementById('dandelion-not-checked-automation');
  let debugBtn = document.getElementById('dandelion-debug-toggle');
  let zenBtn = document.getElementById('dandelion-zen-mode-toggle');

  if (!isProcessing) {
    if (mainBtn) mainBtn.remove();
    if (debugBtn) debugBtn.remove();
    if (zenBtn) zenBtn.remove();
    if (!isAutomationActive && localStorage.getItem(STORAGE_KEY) === null) {
      removeStatusPanel();
    }
    return;
  }

  const isRunningLocally = localStorage.getItem(STORAGE_KEY) !== null;

  if (!mainBtn) {
    mainBtn = button('dandelion-not-checked-automation');
    if (mainBtn) {
      mainBtn.addEventListener('click', async () => {
        if (isAutomationActive) return;

        const pending = localStorage.getItem(STORAGE_KEY);
        if (pending && JSON.parse(pending).length > 0) {
          if (confirm('Ada antrian yang belum selesai. Lanjutkan?')) {
            isAutomationActive = true;
            resumeAutomation();
            return;
          }
        }

        const masterList = await getNotCheckedList();
        if (masterList.length === 0) {
          alert('Daftar target kosong. Gunakan fitur 🐞 untuk menandai baris.');
          return;
        }

        const stats = getQueueStats(masterList);
        if (stats.pendingIds.length === 0) {
          alert(`Analisa: ${stats.foundIds.length} item ditemukan, semuanya sudah selesai.`);
          return;
        }

        if (confirm(`Mulai proses untuk ${stats.pendingIds.length} item yang terpilih?`)) {
          startAutomation(stats.pendingIds, stats.foundIds.length);
        }
      });
      document.body.appendChild(mainBtn);
    }
  }

  if (!zenBtn) {
    zenBtn = zenModeButton(false);
    if (zenBtn) {
      zenBtn.addEventListener('click', () => {
        console.log('Dandelion: Zen Mode button clicked!');
      });
      document.body.appendChild(zenBtn);
    }
  }

  if (!debugBtn) {
    debugBtn = debugButton();
    if (debugBtn) {
      debugBtn.addEventListener('click', () => {
        if (isAutomationActive) return;
        toggleHelperMode();
      });
      document.body.appendChild(debugBtn);
    }
  }

  if (isRunningLocally) {
    updateUIForRunningState(mainBtn, debugBtn);
  }
}

/**
 * Updates button appearance and disables interactions while automation is running.
 * @param {HTMLElement} mainBtn - The primary automation button.
 * @param {HTMLElement} debugBtn - The debug/helper mode toggle button.
 */
function updateUIForRunningState(mainBtn, debugBtn) {
  if (mainBtn) {
    mainBtn.style.opacity = '0.5';
    mainBtn.style.cursor = 'not-allowed';
    mainBtn.style.filter = 'grayscale(1)';
  }
  if (debugBtn) {
    debugBtn.style.opacity = '0.3';
    debugBtn.style.cursor = 'not-allowed';
  }
  document.querySelectorAll(`.${ROW_MARKER_CLASS}`).forEach((m) => {
    m.style.opacity = '0.3';
    m.style.pointerEvents = 'none';
  });
  syncStatusPanel();
}

/**
 * Updates the on-screen progress panel with current task statistics.
 */
function syncStatusPanel() {
  const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const totalFoundOnPage = parseInt(localStorage.getItem(TOTAL_KEY) || '0');
  const doneCount = totalFoundOnPage - pending.length;

  updateStatusPanel(doneCount, totalFoundOnPage, pending.length > 0, {
    onDelete: () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOTAL_KEY);
      isAutomationActive = false;
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
    onDelete: () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOTAL_KEY);
      isAutomationActive = false;
      window.location.reload();
    },
  });

  const rowIdElements = document.querySelectorAll('[id^="rowfrm"]');
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
  isAutomationActive = true;
  const config = await getActiveConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingIds));
  localStorage.setItem(TOTAL_KEY, totalFoundOnPage.toString());
  syncStatusPanel();

  const delay = config.notChecked?.itemDelay || 1000;
  setTimeout(processNextItem, delay);
}

/**
 * Resumes an existing automation session from localStorage.
 */
async function resumeAutomation() {
  const pending = localStorage.getItem(STORAGE_KEY);
  if (pending) {
    const ids = JSON.parse(pending);
    if (ids.length > 0) {
      const config = await getActiveConfig();
      const delay = config.notChecked?.automationDelay || 2000;
      setTimeout(processNextItem, delay);
    } else {
      finishAutomation();
    }
  }
}

/**
 * Performs cleanup of local storage and resets UI state when automation completes.
 */
function finishAutomation() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOTAL_KEY);
  isAutomationActive = false;

  removeStatusPanel(5000);

  const mainBtn = document.getElementById('dandelion-not-checked-automation');
  const debugBtn = document.getElementById('dandelion-debug-toggle');

  if (mainBtn) {
    mainBtn.style.opacity = '1';
    mainBtn.style.cursor = 'pointer';
    mainBtn.style.filter = 'none';
  }
  if (debugBtn) {
    debugBtn.style.opacity = '1';
    debugBtn.style.cursor = 'pointer';
  }
  document.querySelectorAll(`.${ROW_MARKER_CLASS}`).forEach((m) => {
    m.style.opacity = '1';
    m.style.pointerEvents = 'auto';
  });
}

/**
 * Processes the next item in the pending queue by clicking its label and handling confirmation.
 */
async function processNextItem() {
  const pendingStr = localStorage.getItem(STORAGE_KEY);
  if (!pendingStr) {
    isAutomationActive = false;
    return;
  }

  const ids = JSON.parse(pendingStr);
  if (ids.length === 0) {
    finishAutomation();
    return;
  }

  const config = await getActiveConfig();
  const ncConfig = config.notChecked || {};
  syncStatusPanel();

  const currentId = ids[0];
  const rowElement = await waitForRow(currentId, 15_000);

  if (rowElement) {
    const row = rowElement.closest('.grid');
    if (!row) {
      moveToNext(ids, ncConfig.itemDelay);
      return;
    }
    const rowText = row.textContent;
    const label = row.querySelector('label');
    if (rowText.includes('Tidak diperiksa') || rowText.includes('Selesai diperiksa')) {
      moveToNext(ids, ncConfig.itemDelay);
      return;
    }
    if (!label) {
      moveToNext(ids, ncConfig.itemDelay);
      return;
    }
    row.style.backgroundColor = '#fff3e5';
    label.click();

    try {
      const confirmBtn = await waitForElement('button', 'Tidak Periksa', 6000);
      moveToNext(ids, false);
      confirmBtn.click();

      setTimeout(() => {
        if (localStorage.getItem(STORAGE_KEY)) {
          window.location.reload();
        }
      }, ncConfig.reloadDelay || 3000);
    } catch (error) {
      moveToNext(ids, ncConfig.itemDelay);
    }
  } else {
    const masterList = await getNotCheckedList();
    const stats = getQueueStats(masterList);

    if (stats.pendingIds.length === 0) {
      finishAutomation();
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats.pendingIds));
      localStorage.setItem(TOTAL_KEY, stats.foundIds.length.toString());
      setTimeout(processNextItem, ncConfig.itemDelay);
    }
  }
}

/**
 * Moves to the next item in the queue after a specified delay.
 * @param {string[]} ids - The updated list of pending IDs.
 * @param {number|boolean} delay - Delay in milliseconds before next process, or false to skip automatic call.
 */
function moveToNext(ids, delay) {
  ids.shift();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  syncStatusPanel();
  if (typeof delay === 'number') {
    setTimeout(processNextItem, delay);
  }
}
