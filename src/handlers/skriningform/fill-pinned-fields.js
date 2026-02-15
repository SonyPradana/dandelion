/**
 * Fill pinned fields based on data-name and value mapping.
 * Supports: textarea, text input, and radio buttons.
 *
 * @param {Object} pinneds - Object containing data-name as key and value to fill
 * @example
 * pinneds = {
 *   "LPM001-quest|text": "Ya",
 *   "LPM002-quest|freetext": "Tidak ada"
 * }
 */
export function fillPinnedFields (pinneds) {
  for (const key in pinneds) {
    if (Object.prototype.hasOwnProperty.call(pinneds, key)) {
      const value = pinneds[key];
      const questionElement = document.querySelector(`[data-name="${key}"]`);

      if (!questionElement) continue;

      if (hasTextarea(questionElement)) {
        fillTextarea(questionElement, value);
      } else if (hasRadioButton(questionElement)) {
        fillRadioButton(questionElement, value);
      }
    }
  }
}

/**
 * Check if element contains textarea or text input
 *
 * @param {HTMLElement} element - The question element
 * @returns {boolean}
 */
function hasTextarea (element) {
  return element.querySelector('textarea, input[type="text"]') !== null;
}

/**
 * Check if element contains radio button inputs
 *
 * @param {HTMLElement} element - The question element
 * @returns {boolean}
 */
function hasRadioButton (element) {
  return element.querySelector('input[type="radio"]') !== null;
}

/**
 * Fill textarea or text input with the given value
 *
 * @param {HTMLElement} questionElement - The question element containing textarea/input
 * @param {string} value - The value to fill
 */
function fillTextarea (questionElement, value) {
  const inputElement = questionElement.querySelector('textarea, input[type="text"]');

  if (inputElement && inputElement.value !== value) {
    inputElement.value = value;
    inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  }
}

/**
 * Select radio button that matches the given label text
 *
 * @param {HTMLElement} questionElement - The question element containing radio buttons
 * @param {string} targetLabel - The label text to match (e.g., "Ya", "Tidak")
 */
function fillRadioButton (questionElement, targetLabel) {
  const radioLabels = questionElement.querySelectorAll('label.sd-selectbase__label');

  for (const label of radioLabels) {
    const labelTextElement = label.querySelector('span.sd-item__control-label span.sv-string-viewer');

    if (labelTextElement) {
      const labelText = labelTextElement.textContent.trim();

      if (labelText === targetLabel) {
        const radioInput = label.querySelector('input[type="radio"]');

        if (radioInput && !radioInput.checked) {
          radioInput.click();
        }
        break;
      }
    }
  }
}
