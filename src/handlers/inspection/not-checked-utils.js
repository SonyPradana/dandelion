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
      const row = el.closest('.grid, tr');
      const text = row ? row.textContent : '';

      const successImg = row ? row.querySelector('img[src*="icon-success"]') : null;
      const isDone = text.includes('Tidak diperiksa') || 
                     text.includes('Selesai diperiksa') || 
                     (successImg && !successImg.src.includes('gray'));

      if (isDone) {
        doneIds.push(id);
      } else {
        pendingIds.push(id);
      }
    }
  });

  return { foundIds, pendingIds, doneIds };
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
