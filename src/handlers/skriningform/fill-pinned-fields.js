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
export async function fillPinnedFields (pinneds) {
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
      } else if (field.type === 'combobox') {
        await fillDropdowns(questionElement, value);
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
  // Check for combobox
  const dropdown = questionElement.querySelector('.sd-dropdown');
  if (dropdown) {
    return {
      type: 'combobox',
      getValue: () => {
        const valueElement = dropdown.querySelector('.sd-dropdown__value span.sv-string-viewer');
        return valueElement ? valueElement.textContent.trim() : null;
      }
    };
  }

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

/**
 * Select combobox/dropdown option that matches the given text
 *
 * @param {HTMLElement} questionElement - The question element containing combobox
 * @param {string} targetValue - The option text to match
 */
async function fillDropdowns (questionElement, targetValue) {
  const chevronButton = questionElement.querySelector('.sd-dropdown_chevron-button');
  if (!chevronButton) return;

  // Open dropdown
  chevronButton.click();
  await new Promise(resolve => setTimeout(resolve, 300));

  // Find visible options
  const visibleOptions = Array.from(document.querySelectorAll('.sv-popup--dropdown .sv-string-viewer'))
    .filter(option => {
      const popup = option.closest('.sv-popup');
      return popup && popup.style.display !== 'none';
    });

  // Find matching option
  const targetOption = visibleOptions.find(span => {
    const text = span.textContent.trim();
    return text === targetValue;
  });

  if (targetOption) {
    targetOption.closest('.sv-list__item').click();
    await new Promise(resolve => setTimeout(resolve, 200));
  } else {
    // Close dropdown if no match found
    chevronButton.click();
    await new Promise(resolve => setTimeout(resolve, 150));
  }
}
