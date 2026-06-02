import {
  getZenModeState,
  setZenModeState,
  peekNextFromQueue,
  getNextFromQueue,
  clearZenMode,
} from '../utils/zenMode';
import { waitForRow } from './inspection/not-checked-utils';
import { notify } from '../components/notification';
import { increment } from '../utils/productivityTracker';
import { showFlashDataPanel } from '../utils/flashSessionUI';
import { setFlashData, clearFlashData } from '../utils/flashSession';

let isAutomationActive = false;

/**
 * Initializes Zen Mode logic for the list page.
 */
export function initializeZenMode() {
  setInterval(async () => {
    const state = await getZenModeState();
    if (state.active && state.queue.length > 0 && !isAutomationActive) {
      resumeZenAutomation();
    }
  }, 500);
}

/**
 * Starts Zen Mode automation from scratch.
 * Scans the page for any available and active form buttons.
 */
export async function startZenAutomation() {
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
    await notify.alert('Zen Mode', 'Tidak ada form aktif yang ditemukan di halaman ini.');
    return;
  }

  const confirmPromise = notify.confirm(
    'Zen Mode',
    `Ditemukan ${pendingIds.length} form aktif. Mulai Zen Mode?`,
  );
  const flashPromise = showFlashDataPanel();

  const confirmed = await confirmPromise;
  if (!confirmed) {
    const el = document.getElementById('dandelion-flash-data');
    if (el) el.remove();
    return;
  }

  const flashData = await flashPromise;
  if (flashData) {
    await setFlashData(flashData);
  }

  const state = {
    active: true,
    queue: pendingIds,
    total: pendingIds.length,
  };
  await setZenModeState(state);
  isAutomationActive = true;
  processNextZenItem();
}

/**
 * Resumes Zen Mode automation.
 */
async function resumeZenAutomation() {
  isAutomationActive = true;
  processNextZenItem();
}

/**
 * Processes the next item in the Zen Mode queue.
 */
async function processNextZenItem() {
  const nextId = await peekNextFromQueue();

  if (!nextId) {
    await clearZenMode();
    await clearFlashData();
    isAutomationActive = false;
    await notify.alert('Zen Mode', 'Zen Mode Selesai!');
    return;
  }

  // Wait for the row element to actually appear in DOM (up to 5 seconds)
  const rowElement = await waitForRow(nextId, 5000);

  if (!rowElement) {
    await getNextFromQueue();
    processNextZenItem();
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
    processNextZenItem();
    return;
  }

  if (btn) {
    if (row) row.style.backgroundColor = '#e0f2fe';
    btn.click();
    await increment('formZen');
    return;
  }

  // Fallback
  await getNextFromQueue();
  processNextZenItem();
}
