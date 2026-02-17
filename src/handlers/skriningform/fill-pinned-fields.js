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

      const field = detectFieldType(questionElement);

      if (!field) continue;

      if (field.type === 'text') {
        fillTextarea(questionElement, value);
      } else if (field.type === 'radio') {
        fillRadioButton(questionElement, value);
      }
    }
  }
}

/**
 * Detect field type and return type with getValue callback.
 * This is the single source of truth for DOM field detection.
 *
 * @param {HTMLElement} questionElement - The question element container
 * @returns {{ type: string, getValue: Function }|null} Field object or null if not supported
 */
export function detectFieldType (questionElement) {
  // Check for textarea
  const textInput = questionElement.querySelector('textarea, input[type="text"]:not(.sd-dropdown__filter-string-input)');
  if (textInput) {
    return {
      type: 'text',
      getValue: () => textInput.value
    };
  }

  // Check for radio button
  const radioInputs = questionElement.querySelectorAll('input[type="radio"]');
  if (radioInputs.length > 0) {
    return {
      type: 'radio',
      getValue: () => {
        const checkedRadio = questionElement.querySelector('input[type="radio"]:checked');
        if (!checkedRadio) return null;

        const label = checkedRadio.closest('label.sd-selectbase__label');
        if (!label) return null;

        const labelText = label.querySelector('span.sd-item__control-label span.sv-string-viewer');
        return labelText ? labelText.textContent.trim() : null;
      }
    };
  }

  return null;
}

/**
 * Fill textarea or text input with the given value
 *
 * @param {HTMLElement} questionElement - The question element containing textarea/input
 * @param {string} value - The value to fill
 */
function fillTextarea (questionElement, value) {
  const inputElement = questionElement.querySelector('textarea, input[type="text"]:not(.sd-dropdown__filter-string-input)');

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

