import { 
  getZenModeState, 
  setZenModeState, 
  peekNextFromQueue, 
  getNextFromQueue,
  clearZenMode 
} from '../utils/zenMode';
import { getNotCheckedList } from '../utils/notChecked';
import { getQueueStats, waitForRow } from './inspection/not-checked-utils';

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
  }, 2000);
}

/**
 * Starts Zen Mode automation from scratch.
 * Scans the page and builds the queue from currently pending items.
 */
export async function startZenAutomation() {
  const masterList = await getNotCheckedList();
  const stats = getQueueStats(masterList);

  if (stats.pendingIds.length === 0) {
    alert('Tidak ada form aktif untuk diproses.');
    return;
  }

  if (confirm(`Mulai Zen Mode untuk ${stats.pendingIds.length} form?`)) {
    const state = {
      active: true,
      queue: stats.pendingIds,
      total: stats.pendingIds.length
    };
    await setZenModeState(state);
    isAutomationActive = true;
    processNextZenItem();
  }
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
 * Re-verifies if the item is still pending before clicking.
 */
async function processNextZenItem() {
  const nextId = await peekNextFromQueue();
  
  if (!nextId) {
    alert('Zen Mode Selesai!');
    await clearZenMode();
    isAutomationActive = false;
    return;
  }

  // Check if current ID is still pending on the page
  const masterList = await getNotCheckedList();
  const stats = getQueueStats(masterList);
  
  if (!stats.pendingIds.includes(nextId)) {
    console.log(`Dandelion: ${nextId} is no longer pending (done or skipped). Shifting queue...`);
    await getNextFromQueue(); // Remove it
    processNextZenItem(); // Move to next
    return;
  }

  const rowElement = await waitForRow(nextId, 10_000);
  if (rowElement) {
    const btn = rowElement.querySelector('button');
    if (btn) {
      console.log('Dandelion: Clicking Input Data for', nextId);
      rowElement.style.backgroundColor = '#e0f2fe'; // Light blue highlight
      btn.click();
      return;
    }
  }

  // If row not found or button missing, skip this one
  console.warn('Dandelion: Could not find button for', nextId, '. Skipping.');
  await getNextFromQueue();
  processNextZenItem();
}
