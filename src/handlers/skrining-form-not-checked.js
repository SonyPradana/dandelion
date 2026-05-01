import { button } from '../components/button';
import { debugButton } from '../components/debugButton';
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
 * Fitur otomatisasi klik menggunakan ID Baris (rowfrm...)
 * Alur: Monitor -> Detect Processing -> Resume -> Process.
 */

const STORAGE_KEY = 'dandelion_pending_not_checked';
const TOTAL_KEY = 'dandelion_total_not_checked';
const ROW_MARKER_CLASS = 'dandelion-row-marker';

let isAutomationActive = false;

export function initialize() {
  console.log('Dandelion Not-Checked Handler Loaded');
  startStateMonitor();
}

/**
 * Memantau state halaman secara terus-menerus.
 */
function startStateMonitor() {
  setInterval(() => {
    const isProcessing = isPageInProcessingState();

    ensureButtonsMounted(isProcessing);

    const pendingData = localStorage.getItem(STORAGE_KEY);
    if (pendingData) {
      const ids = JSON.parse(pendingData);

      if (ids.length === 0) {
        console.log('Antrian kosong ditemukan. Membersihkan...');
        finishAutomation();
        return;
      }

      if (isProcessing && !isAutomationActive) {
        console.log('%cDetected pending tasks. Resuming...', 'color: #28a745; font-weight: bold');
        isAutomationActive = true;
        resumeAutomation();
      }
    }
  }, 2000);
}

function ensureButtonsMounted(isProcessing) {
  let mainBtn = document.getElementById('dandelion-not-checked-automation');
  let debugBtn = document.getElementById('dandelion-debug-toggle');

  if (!isProcessing) {
    if (mainBtn) mainBtn.remove();
    if (debugBtn) debugBtn.remove();
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
          if (confirm('Ada proses yang tertunda. Lanjutkan?')) {
            isAutomationActive = true;
            resumeAutomation();
            return;
          }
        }

        const masterList = await getNotCheckedList();
        if (masterList.length === 0) {
          alert('Daftar master kosong! Gunakan tombol 🐞 untuk menandai baris.');
          return;
        }

        const stats = getQueueStats(masterList);
        if (stats.pendingIds.length === 0) {
          alert(`Hasil Analisa: ${stats.foundIds.length} item ditemukan, semua sudah selesai.`);
          return;
        }

        if (confirm(`Mulai otomatisasi untuk ${stats.pendingIds.length} item?`)) {
          startAutomation(stats.pendingIds, stats.foundIds.length);
        }
      });
      document.body.appendChild(mainBtn);
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

async function toggleHelperMode() {
  const existingMarkers = document.querySelectorAll(`.${ROW_MARKER_CLASS}`);

  if (existingMarkers.length > 0) {
    existingMarkers.forEach((m) => m.remove());
    removeStatusPanel();
    return;
  }

  const masterList = await getNotCheckedList();
  const stats = getQueueStats(masterList);

  updateStatusPanel(stats.doneIds.length, stats.foundIds.length, 'Helper Mode Active 🐞', {
    title: 'Debug Info',
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

async function startAutomation(pendingIds, totalFoundOnPage) {
  isAutomationActive = true;
  const config = await getActiveConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingIds));
  localStorage.setItem(TOTAL_KEY, totalFoundOnPage.toString());
  syncStatusPanel();

  const delay = config.notChecked?.itemDelay || 1000;
  setTimeout(processNextItem, delay);
}

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

function finishAutomation() {
  console.log('%cAutomation Finished. Cleaning up...', 'color: #28a745; font-weight: bold');
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
  console.log(`Waiting for row: ${currentId}...`);

  const rowElement = await waitForRow(currentId, 15000);

  if (rowElement) {
    const row = rowElement.closest('.grid');
    if (!row) {
      moveToNext(ids, ncConfig.itemDelay);
      return;
    }
    const rowText = row.textContent;
    const label = row.querySelector('label');
    if (rowText.includes('Tidak diperiksa') || rowText.includes('Selesai diperiksa')) {
      console.log(`Row ${currentId} already done. Skipping.`);
      moveToNext(ids, ncConfig.itemDelay);
      return;
    }
    if (!label) {
      console.warn(`Label not found in ${currentId}. Skipping.`);
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
      console.error('Confirmation popup timeout:', error);
      moveToNext(ids, ncConfig.itemDelay);
    }
  } else {
    console.warn(`Row ${currentId} not found after 15s. Re-analyzing...`);
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

function moveToNext(ids, delay) {
  ids.shift();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  syncStatusPanel();
  if (typeof delay === 'number') {
    setTimeout(processNextItem, delay);
  }
}
