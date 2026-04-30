import { button } from '../components/button';
import { debugButton } from '../components/debugButton';
import { createRowMarker } from '../components/rowMarker';
import { updateStatusPanel, removeStatusPanel } from '../components/statusPanel';
import { getNotCheckedList } from '../utils/notChecked';
import { getActiveConfig } from '../configuration';

/**
 * Fitur otomatisasi klik menggunakan ID Baris (rowfrm...)
 * Alur: Analisa DOM -> Bersihkan Antrian Local -> Eksekusi -> Refresh.
 */

const STORAGE_KEY = 'dandelion_pending_not_checked';
const TOTAL_KEY = 'dandelion_total_not_checked';
const ROW_MARKER_CLASS = 'dandelion-row-marker';

export function initialize() {
  console.log('Skrining Form Not Checked Handler Active');

  const mountInterval = setInterval(() => {
    ensureButtonsMounted();
  }, 2000);

  function ensureButtonsMounted() {
    let mainBtn = document.getElementById('dandelion-not-checked-automation');
    let debugBtn = document.getElementById('dandelion-debug-toggle');

    const isRunning = localStorage.getItem(STORAGE_KEY) !== null;

    if (!mainBtn) {
      mainBtn = button('dandelion-not-checked-automation');
      if (mainBtn) {
        mainBtn.addEventListener('click', async () => {
          if (mainBtn.style.opacity === '0.5') return;

          const pending = localStorage.getItem(STORAGE_KEY);
          if (pending && JSON.parse(pending).length > 0) {
            if (confirm('Ada proses yang tertunda. Lanjutkan?')) {
              resumeAutomation();
              return;
            }
          }

          const masterList = await getNotCheckedList();
          if (masterList.length === 0) {
            alert('Daftar master kosong! Gunakan tombol 🐞 untuk menandai baris.');
            return;
          }

          console.log('%cMemulai Analisa Antrian...', 'color: #007bff; font-weight: bold');
          const validIds = analyzeTaskQueue(masterList);
          
          if (validIds.length === 0) {
            alert('Hasil Analisa: Tidak ada item dari daftar yang perlu diproses di halaman ini.');
            return;
          }

          if (
            confirm(
              `Ditemukan ${validIds.length} item yang perlu diproses (dari total ${masterList.length} di Master List). Mulai?`,
            )
          ) {
            startAutomation(validIds);
          }
        });
        document.body.appendChild(mainBtn);
      }
    }

    if (!debugBtn) {
      debugBtn = debugButton();
      if (debugBtn) {
        debugBtn.addEventListener('click', () => {
          if (isRunning) return;
          toggleHelperMode();
        });
        document.body.appendChild(debugBtn);
      }
    }

    if (isRunning) {
      updateUIForRunningState(mainBtn, debugBtn);
    }
  }

  ensureButtonsMounted();
  resumeAutomation();
}

function analyzeTaskQueue(masterList) {
  return masterList.filter((id) => {
    const el = document.getElementById(id);
    if (!el) return false;

    const row = el.closest('.grid');
    if (row) {
      const text = row.textContent;
      if (text.includes('Tidak diperiksa') || text.includes('Selesai diperiksa')) {
        return false;
      }
    }

    return true;
  });
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
  const total = parseInt(localStorage.getItem(TOTAL_KEY) || '0');
  updateStatusPanel(total - pending.length, total, pending.length > 0, {
    onDelete: () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOTAL_KEY);
      window.location.reload();
    },
  });
}

function toggleHelperMode() {
  const rowIdElements = document.querySelectorAll('[id^="rowfrm"]');
  const existingMarkers = document.querySelectorAll(`.${ROW_MARKER_CLASS}`);

  if (existingMarkers.length > 0) {
    existingMarkers.forEach((m) => m.remove());
    removeStatusPanel();
    return;
  }

  // Helper Mode ON: Show status and markers
  const activeIds = Array.from(rowIdElements).map((el) => el.id);
  const remainingIds = analyzeTaskQueue(activeIds);

  updateStatusPanel(remainingIds.length, activeIds.length, 'Helper Mode Active 🐞', {
    title: 'Debug Info',
    onDelete: () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOTAL_KEY);
      window.location.reload();
    },
  });

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

async function startAutomation(ids) {
  const config = await getActiveConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  localStorage.setItem(TOTAL_KEY, ids.length.toString());
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
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOTAL_KEY);
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
  if (!pendingStr) return;
  
  const ids = JSON.parse(pendingStr);
  if (ids.length === 0) {
    finishAutomation();
    return;
  }
  
  const config = await getActiveConfig();
  const ncConfig = config.notChecked || {};
  syncStatusPanel();
  
  const currentId = ids[0];
  const rowElement = await waitForRow(currentId, 10_000);
  
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
      const confirmBtn = await waitForElement('button', 'Tidak Periksa', 5000);
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
    moveToNext(ids, ncConfig.itemDelay);
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

function waitForRow(id, timeout = 10_000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const check = () => {
      const el = document.getElementById(id);
      if (el) resolve(el);
      else if (Date.now() - startTime > timeout) resolve(null);
      else setTimeout(check, 500);
    };
    check();
  });
}

function waitForElement(selector, textContent, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const elements = Array.from(document.querySelectorAll(selector));
      const found = elements.find((el) => el.textContent.includes(textContent));
      if (found) resolve(found);
      else if (Date.now() - startTime > timeout) reject(new Error('Timeout'));
      else setTimeout(check, 500);
    };
    check();
  });
}
