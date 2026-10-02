import { isInNotCheckedList } from '../utils/notChecked';
import {
  getZenModeState,
  setZenModeState,
  peekNextFromQueue,
  getNextFromQueue,
  clearZenMode,
} from '../utils/zenMode';
import {
  waitForRow,
  clickFinishServiceButton,
  getActiveRowIds,
  countUnresolvedRows,
  isRowDone,
  TABLE_ID,
} from './inspection/not-checked-utils';
import { notify } from '../components/notification';
import bus from '../utils/hooks';
import { showFlashDataPanelIfEnabled } from './flashData';
import { clearFlashData } from '../utils/flashSession';
import { store } from '../store.js';

let isZeroAutomationActive = false;

/**
 * Initializes Zero Mode logic for the list page.
 * Resumes a pending Zero run after page reloads.
 */
export function initializeZeroMode() {
  let isPolling = false;

  async function poll() {
    if (isPolling) return;
    isPolling = true;

    try {
      const state = await getZenModeState();
      if (state.active && state.mode === 'zero' && !isZeroAutomationActive) {
        resumeZeroAutomation();
      }
      setTimeout(poll, state.active ? 500 : 10_000);
    } finally {
      isPolling = false;
    }
  }
  poll();
}

/**
 * Starts Zero Mode automation from scratch.
 * Scans the page for any available and active form buttons.
 */
export async function startZeroAutomation() {
  const pendingIds = getActiveRowIds();

  if (pendingIds.length === 0) {
    await notify.alert('Zero Mode', 'Tidak ada form aktif yang ditemukan di halaman ini.');
    return;
  }

  let skipCount = 0;
  for (const id of pendingIds) {
    if (await isInNotCheckedList(id)) {
      skipCount += 1;
    }
  }

  const confirmPromise = notify.confirm(
    'Zero Mode',
    `Ditemukan ${pendingIds.length} form aktif (${skipCount} dilewati, ${
      pendingIds.length - skipCount
    } diisi). Mulai Zero Mode?`,
  );
  showFlashDataPanelIfEnabled();

  const confirmed = await confirmPromise;

  if (!confirmed) {
    clearFlashData();
    const el = document.getElementById('dandelion-flash-data');
    if (el) el.remove();
    return;
  }

  const state = {
    active: true,
    queue: pendingIds,
    total: pendingIds.length,
    mode: 'zero',
  };
  await setZenModeState(state);
  isZeroAutomationActive = true;
  processNextZeroItem();
}

/**
 * Resumes Zero Mode automation.
 */
async function resumeZeroAutomation() {
  isZeroAutomationActive = true;
  processNextZeroItem();
}

/**
 * Processes the next item in the Zero Mode queue.
 */
async function processNextZeroItem() {
  const nextId = await peekNextFromQueue();

  if (!nextId) {
    // Empty queue ≠ task complete; only decide on the list page and re-check
    // DOM before offering to finish.
    if (!document.getElementById(TABLE_ID)) {
      isZeroAutomationActive = false;
      return;
    }

    await clearZenMode();
    await clearFlashData();
    isZeroAutomationActive = false;

    const unresolved = countUnresolvedRows();
    if (unresolved > 0) {
      const confirmed = await notify.confirm(
        'Zero Mode',
        `Ada ${unresolved} item yang belum selesai. Tetap selesaikan layanan?`,
      );
      if (confirmed) {
        clickFinishServiceButton();
      }
      return;
    }

    await notify.alert('Zero Mode', 'Zero Mode Selesai!');
    if (await notify.confirm('Konfirmasi', 'Selesaikan Layanan?')) {
      clickFinishServiceButton();
    }
    return;
  }

  if (!document.querySelector('[id^="rowfrm"],[id^="row-FRM"]')) {
    isZeroAutomationActive = false;
    return;
  }

  // Wait for the row element to actually appear in DOM (up to 5 seconds)
  const rowElement = await waitForRow(nextId, 5000);

  if (!rowElement) {
    await getNextFromQueue();
    processNextZeroItem();
    return;
  }

  const row = rowElement.closest('.grid, tr');
  const btn = rowElement.querySelector('button');

  // Re-verify if still pending and clickable
  const isClickable = btn && !btn.disabled && !btn.classList.contains('cursor-not-allowed');

  if (isRowDone(row) || !isClickable) {
    await getNextFromQueue();
    processNextZeroItem();
    return;
  }

  // Rows on the "Not Checked" list are skipped outright: no click and no
  // reload. Zero still emits didProcessItem so the skip counts as processed
  // work in the productivity tracker.
  if (await isInNotCheckedList(nextId)) {
    await getNextFromQueue();
    bus.emit('notChecked:didProcessItem');
    processNextZeroItem();
    return;
  }

  if (btn) {
    if (row) row.style.backgroundColor = '#e0f2fe';
    btn.click();
    bus.emit('zenMode:didProcessItem');
    return;
  }

  // Fallback
  await getNextFromQueue();
  processNextZeroItem();
}

/**
 * @returns {Promise<string[]>} Remaining queue IDs for a Zero session.
 * @param {import('../store.js').DandelionStore} [storeRef]
 */
export async function getZeroQueue(storeRef = store) {
  const state = await getZenModeState(storeRef);
  return state.mode === 'zero' ? state.queue : [];
}

/**
 * Checks whether the Zero automation is currently running.
 * @param {import('../store.js').DandelionStore} [storeRef]
 * @returns {Promise<boolean>}
 */
export async function isZeroRunning(storeRef = store) {
  const state = await getZenModeState(storeRef);
  return state.active && state.mode === 'zero' && state.queue.length > 0;
}
