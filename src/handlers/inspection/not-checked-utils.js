/**
 * ID of the services container on the list page.
 */
export const TABLE_ID = 'tableLayanan';

/**
 * Status badge text shown on a form row once the examination is finished.
 */
export const DONE_TEXT = 'Selesai Pemeriksaan';

/**
 * Checks whether a form row is already finished.
 * @param {HTMLElement|null} row - The closest .grid / tr container of a row.
 * @returns {boolean} True if the row no longer needs to be filled.
 */
export function isRowDone(row) {
  if (!row) return false;

  const successImg = row.querySelector('img[src*="icon-success"]');

  return (
    row.textContent.includes(DONE_TEXT) || Boolean(successImg && !successImg.src.includes('gray'))
  );
}

/**
 * Checks if the page is in a state ready for processing (active examination).
 * @returns {boolean} True if the page indicators show an active processing state.
 */
export function isPageInProcessingState() {
  const content = document.body.textContent || '';
  const hasProcessingText = content.includes('Sedang Pemeriksaan');

  const hasFinishButton = Array.from(document.querySelectorAll('button, div')).some(
    (el) =>
      el.textContent.includes('Selesaikan Layanan') && !el.classList.contains('cursor-not-allowed'),
  );

  return hasProcessingText || hasFinishButton;
}

/**
 * Calculates queue statistics based on the master list and current DOM state.
 * @param {string[]} masterList - The full list of IDs from the configuration.
 * @returns {{ foundIds: string[], pendingIds: string[], doneIds: string[] }} Object containing categorized ID lists.
 */
export function getQueueStats(masterList) {
  const foundIds = [];
  const pendingIds = [];
  const doneIds = [];

  masterList.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      foundIds.push(id);
      if (isRowDone(el.closest('.grid, tr'))) {
        doneIds.push(id);
      } else {
        pendingIds.push(id);
      }
    }
  });

  return { foundIds, pendingIds, doneIds };
}

/**
 * Collects the IDs of rows that are still active on the list page.
 * A row is done when it shows 'Selesai diperiksa' or a non-gray success
 * icon; it is active when it is not done and its button is clickable.
 * @returns {string[]} IDs of rows with an actionable button.
 */
export function getActiveRowIds() {
  const rowElements = Array.from(document.querySelectorAll('[id^="rowfrm"],[id^="row-FRM"]'));
  const activeIds = [];

  rowElements.forEach((el) => {
    const row = el.closest('.grid, tr');
    const button = el.querySelector('button');
    if (!row) return;

    const isClickable =
      button && !button.disabled && !button.classList.contains('cursor-not-allowed');

    if (!isRowDone(row) && isClickable) {
      activeIds.push(el.id);
    }
  });

  return activeIds;
}

/**
 * Counts rows that are not yet marked done on the list page.
 * Unlike getActiveRowIds, this ignores the button state: a non-done row is
 * unresolved even when its button is disabled or non-clickable, so the
 * completion gate never reports zero while such a row remains.
 * @returns {number} Unresolved row count. 0 means the task is complete.
 */
export function countUnresolvedRows() {
  const rowElements = Array.from(document.querySelectorAll('[id^="rowfrm"],[id^="row-FRM"]'));
  let unresolved = 0;

  rowElements.forEach((el) => {
    const row = el.closest('.grid, tr');
    if (!row) return;

    if (!isRowDone(row)) unresolved += 1;
  });

  return unresolved;
}

/**
 * Finds and clicks the "Selesaikan Layanan" button if available.
 * @returns {boolean} True if the button was found and clicked.
 */
export function clickFinishServiceButton() {
  const buttons = document.querySelectorAll('button');
  const finishBtn = Array.from(buttons).find(
    (btn) =>
      btn.textContent.includes('Selesaikan Layanan') &&
      !btn.classList.contains('cursor-not-allowed'),
  );
  if (finishBtn) {
    finishBtn.click();
    return true;
  }
  return false;
}

/**
 * Waits for a specific row element to appear in the DOM.
 * @param {string} id - The ID of the element to wait for.
 * @param {number} [timeout=10000] - Maximum time to wait in milliseconds.
 * @returns {Promise<HTMLElement|null>} Resolves to the element if found, or null if timeout occurs.
 */
export function waitForRow(id, timeout = 10_000) {
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

/**
 * Waits for a generic element to appear based on selector and text content.
 * @param {string} selector - CSS selector to search for.
 * @param {string} textContent - Text content that the element must contain.
 * @param {number} [timeout=5000] - Maximum time to wait in milliseconds.
 * @returns {Promise<HTMLElement>} Resolves to the found element.
 * @throws {Error} If the element is not found within the timeout period.
 */
export function waitForElement(selector, textContent, timeout = 5000) {
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
