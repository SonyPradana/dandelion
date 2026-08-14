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
  waitForElement,
  clickFinishServiceButton,
  hasRemainingForms,
} from './inspection/not-checked-utils';
import { notify } from '../components/notification';
import bus from '../utils/hooks';
import { showFlashDataPanelIfEnabled } from './flashData';
import { clearFlashData } from '../utils/flashSession';
import { store } from '../store.js';

const ZERO_RELOAD_DELAY = 1000;

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
  const rowElements = Array.from(document.querySelectorAll('[id^="rowfrm"],[id^="row-FRM"]'));
  const pendingIds = [];

  rowElements.forEach((el) => {
    const row = el.closest('.grid, tr');
    const button = el.querySelector('button');

    // Check if row is not "Done"
    const successImg = row ? row.querySelector('img[src*="icon-success"]') : null;
    const isDone =
      row &&
      (row.textContent.includes('Selesai diperiksa') ||
        (successImg && !successImg.src.includes('gray')));

    // Check if button is clickable
    const isClickable =
      button && !button.disabled && !button.classList.contains('cursor-not-allowed');

    if (!isDone && isClickable) {
      pendingIds.push(el.id);
    }
  });

  if (pendingIds.length === 0) {
    await notify.alert('Zero Mode', 'Tidak ada form aktif yang ditemukan di halaman ini.');
    return;
  }

  let uncheckCount = 0;
  for (const id of pendingIds) {
    if (await isInNotCheckedList(id)) {
      uncheckCount += 1;
    }
  }

  const confirmPromise = notify.confirm(
    'Zero Mode',
    `Ditemukan ${pendingIds.length} form aktif (${uncheckCount} di-uncheck, ${
      pendingIds.length - uncheckCount
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
    await clearZenMode();
    await clearFlashData();
    isZeroAutomationActive = false;

    if (!(await hasRemainingForms())) {
      await notify.alert('Zero Mode', 'Zero Mode Selesai!');
      if (await notify.confirm('Konfirmasi', 'Selesaikan Layanan?')) {
        clickFinishServiceButton();
      }
    }
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
  const successImg = row ? row.querySelector('img[src*="icon-success"]') : null;
  const isDone =
    row &&
    (row.textContent.includes('Selesai diperiksa') ||
      (successImg && !successImg.src.includes('gray')));
  const isClickable = btn && !btn.disabled && !btn.classList.contains('cursor-not-allowed');

  if (isDone || !isClickable) {
    await getNextFromQueue();
    processNextZeroItem();
    return;
  }

  // Items in the "Not Checked" master list are marked as not-checked instead
  // of being visited and filled.
  if (await isInNotCheckedList(nextId)) {
    await processUncheckItem(rowElement, row);
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
 * Marks a form as not-checked: clicks the row label and confirms "Tidak Periksa",
 * then shifts the queue and reloads before continuing.
 * @param {HTMLElement} rowElement - The row element found by waitForRow.
 * @param {HTMLElement|null} row - The closest .grid / tr container.
 */
async function processUncheckItem(rowElement, row) {
  const rowText = row ? row.textContent : '';
  if (rowText.includes('Tidak diperiksa') || rowText.includes('Selesai diperiksa')) {
    await getNextFromQueue();
    processNextZeroItem();
    return;
  }

  const label = row ? row.querySelector('label') : rowElement.querySelector('label');
  if (!label) {
    await getNextFromQueue();
    processNextZeroItem();
    return;
  }

  if (row) row.style.backgroundColor = '#fff3e5';
  label.click();

  try {
    const confirmBtn = await waitForElement('button', 'Tidak Periksa', 6000);
    await getNextFromQueue();
    confirmBtn.click();
    bus.emit('notChecked:didProcessItem');

    setTimeout(() => {
      window.location.reload();
    }, ZERO_RELOAD_DELAY);
  } catch {
    await getNextFromQueue();
    processNextZeroItem();
  }
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
