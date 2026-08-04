import { isInNotCheckedList } from '../utils/notChecked';
import { setZenModeState, clearZenMode } from '../utils/zenMode';
import {
  waitForRow,
  waitForElement,
  hasRemainingForms,
  clickFinishServiceButton,
} from './inspection/not-checked-utils';
import { notify } from '../components/notification';
import bus from '../utils/hooks';
import { showFlashDataPanelIfEnabled } from './flashData';
import { clearFlashData } from '../utils/flashSession';
import { store } from '../store.js';

const ZERO_QUEUE_KEY = 'dandelion_zero_queue';
const ZERO_TOTAL_KEY = 'dandelion_zero_total';
const ZERO_DOM_TIMEOUT = 5000;
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
      const queue = await readQueue();
      if (queue.length > 0 && !isZeroAutomationActive) {
        resumeZeroAutomation();
      }
      setTimeout(poll, queue.length > 0 ? 500 : 10_000);
    } finally {
      isPolling = false;
    }
  }
  poll();
}

/**
 * Starts Zero Mode automation from scratch.
 * Scans the page and partitions pending forms into "uncheck" and "zen" targets.
 */
export async function startZeroAutomation() {
  const rowElements = Array.from(document.querySelectorAll('[id^="rowfrm"],[id^="row-FRM"]'));
  const queue = [];

  for (const el of rowElements) {
    const row = el.closest('.grid, tr');
    const button = el.querySelector('button');

    const successImg = row ? row.querySelector('img[src*="icon-success"]') : null;
    const isDone =
      row &&
      (row.textContent.includes('Selesai diperiksa') ||
        (successImg && !successImg.src.includes('gray')));

    const isClickable =
      button && !button.disabled && !button.classList.contains('cursor-not-allowed');

    if (isDone || !isClickable) continue;

    const shouldUncheck = await isInNotCheckedList(el.id);
    queue.push({ id: el.id, action: shouldUncheck ? 'uncheck' : 'zen' });
  }

  if (queue.length === 0) {
    await notify.alert('Zero Mode', 'Tidak ada form aktif yang ditemukan di halaman ini.');
    return;
  }

  const uncheckCount = queue.filter((item) => item.action === 'uncheck').length;
  const zenCount = queue.length - uncheckCount;

  const confirmPromise = notify.confirm(
    'Zero Mode',
    `Ditemukan ${queue.length} form aktif (${uncheckCount} di-uncheck, ${zenCount} diisi). Mulai Zero Mode?`,
  );
  showFlashDataPanelIfEnabled();

  const confirmed = await confirmPromise;

  if (!confirmed) {
    clearFlashData();
    const el = document.getElementById('dandelion-flash-data');
    if (el) el.remove();
    return;
  }

  await saveQueue(queue);
  await store.storageSet(ZERO_TOTAL_KEY, JSON.stringify(queue.length));

  const zenIds = queue.filter((item) => item.action === 'zen').map((item) => item.id);
  if (zenIds.length > 0) {
    await setZenModeState({ active: true, queue: zenIds, total: zenIds.length });
  }

  isZeroAutomationActive = true;
  processNextZeroItem();
}

/**
 * Resumes Zero automation from storage (e.g. after a reload).
 */
async function resumeZeroAutomation() {
  isZeroAutomationActive = true;
  processNextZeroItem();
}

/**
 * Processes the next item in the Zero queue.
 */
async function processNextZeroItem() {
  const queue = await readQueue();
  const next = queue[0];

  if (!next) {
    await clearZeroState();

    if (!(await hasRemainingForms())) {
      await notify.alert('Zero Mode', 'Zero Mode Selesai!');
      if (await notify.confirm('Konfirmasi', 'Selesaikan Layanan?')) {
        clickFinishServiceButton();
      }
    }
    return;
  }

  const rowElement = await waitForRow(next.id, ZERO_DOM_TIMEOUT);

  if (!rowElement) {
    await shiftQueue();
    processNextZeroItem();
    return;
  }

  const row = rowElement.closest('.grid, tr');

  if (next.action === 'uncheck') {
    await processUncheckItem(rowElement, row, next.id);
  } else {
    await processZenItem(rowElement, row);
  }
}

/**
 * Unchecks a form: clicks the row label and confirms "Tidak Periksa".
 */
async function processUncheckItem(rowElement, row, id) {
  const rowText = row ? row.textContent : '';
  if (rowText.includes('Tidak diperiksa') || rowText.includes('Selesai diperiksa')) {
    await shiftQueue();
    processNextZeroItem();
    return;
  }

  const label = row ? row.querySelector('label') : rowElement.querySelector('label');
  if (!label) {
    await shiftQueue();
    processNextZeroItem();
    return;
  }

  if (row) row.style.backgroundColor = '#fff3e5';
  label.click();

  try {
    const confirmBtn = await waitForElement('button', 'Tidak Periksa', 6000);
    await shiftQueue();
    confirmBtn.click();
    bus.emit('zeroMode:didUncheck', { id });

    setTimeout(() => {
      window.location.reload();
    }, ZERO_RELOAD_DELAY);
  } catch {
    await shiftQueue();
    processNextZeroItem();
  }
}

/**
 * Fills a single form via zen: clicks the row's Input Data button.
 * The item stays in the queue until the row becomes done after the form is filled.
 */
async function processZenItem(rowElement, row) {
  const btn = rowElement.querySelector('button');

  const successImg = row ? row.querySelector('img[src*="icon-success"]') : null;
  const isDone =
    row &&
    (row.textContent.includes('Selesai diperiksa') ||
      (successImg && !successImg.src.includes('gray')));
  const isClickable = btn && !btn.disabled && !btn.classList.contains('cursor-not-allowed');

  if (isDone || !isClickable) {
    await shiftQueue();
    processNextZeroItem();
    return;
  }

  if (btn) {
    if (row) row.style.backgroundColor = '#e0f2fe';
    btn.click();
    bus.emit('zeroMode:didProcessItem');
    return;
  }

  await shiftQueue();
  processNextZeroItem();
}

// ---- Queue helpers ----

async function readQueue() {
  const raw = await store.storageGet(ZERO_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue) {
  await store.storageSet(ZERO_QUEUE_KEY, JSON.stringify(queue));
}

async function shiftQueue() {
  const queue = await readQueue();
  if (queue.length > 0) queue.shift();
  await saveQueue(queue);
  return queue;
}

async function clearZeroState() {
  await store.storageRemoveMany([ZERO_QUEUE_KEY, ZERO_TOTAL_KEY]);
  await clearZenMode();
  isZeroAutomationActive = false;
}

/**
 * @returns {Promise<string[]>} Remaining queue IDs.
 */
export async function getZeroQueue() {
  const queue = await readQueue();
  return queue.map((item) => item.id);
}

/**
 * Checks whether the Zero automation is currently running.
 * @param {import('../store.js').DandelionStore} [storeRef]
 * @returns {Promise<boolean>}
 */
export async function isZeroRunning(storeRef = store) {
  const raw = await storeRef.storageGet(ZERO_QUEUE_KEY);
  return raw !== null && JSON.parse(raw).length > 0;
}
