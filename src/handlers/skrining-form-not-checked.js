import { button } from '../components/button';
import { debugButton } from '../components/debugButton';
import { createNotCheckedToggle } from '../components/notCheckedToggle';
import { getNotCheckedList } from '../utils/notChecked';

/**
 * Fitur otomatisasi klik menggunakan ID Baris (rowfrm...)
 * Alur: Pre-check -> Simpan State Lokal -> Eksekusi -> Refresh.
 */

const STORAGE_KEY = 'dandelion_pending_not_checked';
const TOTAL_KEY = 'dandelion_total_not_checked';
const DEBUG_MARKER_CLASS = 'dandelion-row-marker';

export function initialize() {
  console.log('Skrining Form Not Checked Handler Active');

  const mountInterval = setInterval(() => {
    ensureButtonsMounted();
  }, 2000);

  function ensureButtonsMounted() {
    let mainBtn = document.getElementById('dandelion-not-checked-automation');
    let debugBtn = document.getElementById('dandelion-debug-toggle');
    const statusPanel = document.getElementById('dandelion-status-panel');

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
          console.log('%cMaster List (Config):', 'color: #ffd700; font-weight: bold', masterList);

          if (masterList.length === 0) {
            alert('Daftar target (Master List) kosong! Gunakan tombol 🐞 untuk menandai baris.');
            return;
          }

          // PRE-CHECK: Remove IDs that are already "Done" in current DOM
          // This creates a local execution list without affecting the Master List in config.
          const executionList = filterAlreadyDoneIds(masterList);

          if (executionList.length === 0) {
            alert('Semua item dalam Master List sudah diperiksa atau selesai di halaman ini.');
            return;
          }

          if (
            confirm(
              `Mulai otomatisasi untuk ${executionList.length} item yang belum diisi (dari total ${masterList.length} di Master List)?`,
            )
          ) {
            startAutomation(executionList);
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

    if (!statusPanel && isRunning) {
      createStatusPanel();
    }

    // UI state updates
    if (isRunning) {
      if (mainBtn) {
        mainBtn.style.opacity = '0.5';
        mainBtn.style.cursor = 'not-allowed';
        mainBtn.style.filter = 'grayscale(1)';
      }
      if (debugBtn) {
        debugBtn.style.opacity = '0.3';
        debugBtn.style.cursor = 'not-allowed';
      }
      // Disable existing markers
      document.querySelectorAll(`.${DEBUG_MARKER_CLASS}`).forEach((m) => {
        m.style.opacity = '0.3';
        m.style.pointerEvents = 'none';
      });
      updateStatusPanel();
    }
  }

  ensureButtonsMounted();
  resumeAutomation();
}

/**
 * Filter IDs that are already marked as "Tidak diperiksa" or "Selesai diperiksa"
 * locally for the current execution session.
 */
function filterAlreadyDoneIds(ids) {
  return ids.filter((id) => {
    const el = document.getElementById(id);
    const row = el ? el.closest('.grid') : null;
    if (row) {
      const text = row.textContent;
      if (text.includes('Tidak diperiksa') || text.includes('Selesai diperiksa')) {
        console.log(`%cLocal Filter: Skipping ${id} (Already Done/Checked)`, 'color: gray');
        return false;
      }
    }
    return true;
  });
}

function toggleHelperMode() {
  const rowIdElements = document.querySelectorAll('[id^="rowfrm"]');
  const existingMarkers = document.querySelectorAll(`.${DEBUG_MARKER_CLASS}`);

  if (existingMarkers.length > 0) {
    existingMarkers.forEach((m) => m.remove());
    return;
  }

  initializeMarkerStyles();

  rowIdElements.forEach((el) => {
    const gridRow = el.closest('.grid');
    if (!gridRow) return;

    const titleColumn = gridRow.querySelector('div:first-child');
    if (!titleColumn) return;

    if (window.getComputedStyle(titleColumn).position === 'static') {
      titleColumn.style.position = 'relative';
    }

    const marker = document.createElement('div');
    marker.className = DEBUG_MARKER_CLASS;

    const idText = document.createElement('span');
    idText.textContent = el.id;
    idText.style.marginRight = '2px';

    const toggle = createNotCheckedToggle(el.id);

    marker.appendChild(idText);
    marker.appendChild(toggle);
    titleColumn.appendChild(marker);
  });
}

function initializeMarkerStyles() {
  if (document.getElementById('dandelion-row-marker-styles')) return;
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dandelion-row-marker-styles';
  styleSheet.textContent = `
    .${DEBUG_MARKER_CLASS} {
      position: absolute; top: -0.8rem; left: 3rem; z-index: 1000;
      background-color: rgba(253, 255, 153, 0.95); color: #171717;
      padding: 2px 8px; font-size: 10px; font-family: monospace;
      font-weight: bold; border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px; display: flex; align-items: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15); pointer-events: auto;
      white-space: nowrap; backdrop-filter: blur(4px);
    }
  `;
  document.head.appendChild(styleSheet);
}

function createStatusPanel() {
  const panel = document.createElement('div');
  panel.id = 'dandelion-status-panel';
  panel.style.cssText = `
    position: fixed; top: 7rem; right: 0.75rem; z-index: 9997;
    padding: 0.5rem 0.75rem; background: rgba(0, 0, 0, 0.7);
    color: white; border-radius: 8px; font-size: 0.75rem;
    pointer-events: none; display: flex; flex-direction: column;
    gap: 2px; min-width: 100px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(panel);
}

function updateStatusPanel() {
  const panel = document.getElementById('dandelion-status-panel');
  if (!panel) return;
  const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const total = parseInt(localStorage.getItem(TOTAL_KEY) || '0');
  const done = total - pending.length;
  panel.innerHTML = `
    <div style="font-weight: bold; color: #ffd700;">Dandelion running</div>
    <div>Progress: ${done}/${total}</div>
    <div style="font-size: 0.7rem; opacity: 0.8;">${pending.length > 0 ? '⏳ Processing...' : '✅ All Done'}</div>
  `;
}

function startAutomation(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  localStorage.setItem(TOTAL_KEY, ids.length.toString());
  createStatusPanel();
  processNextItem();
}

function resumeAutomation() {
  const pending = localStorage.getItem(STORAGE_KEY);
  if (pending) {
    const ids = JSON.parse(pending);
    if (ids.length > 0) {
      setTimeout(processNextItem, 2000);
    } else {
      finishAutomation();
    }
  }
}

function finishAutomation() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOTAL_KEY);
  const panel = document.getElementById('dandelion-status-panel');
  if (panel) {
    panel.innerHTML = `
      <div style="font-weight: bold; color: #00ff00;">Task Finished</div>
      <div>Done ✓</div>
    `;
    setTimeout(() => panel.remove(), 5000);
  }
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
  document.querySelectorAll(`.${DEBUG_MARKER_CLASS}`).forEach((m) => {
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
  updateStatusPanel();
  const currentId = ids[0];
  const rowElement = await waitForRow(currentId, 10_000);
  if (rowElement) {
    const row = rowElement.closest('.grid');
    if (!row) {
      moveToNext(ids);
      return;
    }
    const rowText = row.textContent;
    const label = row.querySelector('label');
    if (rowText.includes('Tidak diperiksa') || rowText.includes('Selesai diperiksa')) {
      moveToNext(ids);
      return;
    }
    if (!label) {
      moveToNext(ids);
      return;
    }
    row.style.backgroundColor = '#fff3e5';
    label.click();
    try {
      const confirmBtn = await waitForElement('button', 'Tidak Periksa', 5000);
      moveToNext(ids, false);
      confirmBtn.click();
      setTimeout(() => {
        if (localStorage.getItem(STORAGE_KEY)) window.location.reload();
      }, 3000);
    } catch (error) {
      moveToNext(ids);
    }
  } else {
    moveToNext(ids);
  }
}

function moveToNext(ids, continueImmediately = true) {
  ids.shift();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  updateStatusPanel();
  if (continueImmediately) setTimeout(processNextItem, 1000);
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
