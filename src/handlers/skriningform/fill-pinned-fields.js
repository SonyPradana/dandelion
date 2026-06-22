import { isFieldFilled } from './respect-input';

/**
 * Fill pinned fields based on data-name and value mapping.
 * Supports: textarea, text input, and radio buttons.
 *
 * @param {Object} pinneds - Object containing data-name as key and value to fill
 * @param {boolean} [respectInput=false] - Skip if field already has value
 * @returns {Promise<{radio: number, freetext: number, dropdown: number}>}
 * @example
 * pinneds = {
 *   "LPM001-quest|text": "Ya",
 *   "LPM002-quest|freetext": "Tidak ada"
 * }
 */
export async function fillPinnedFields(pinneds, respectInput = false) {
  let radio = 0;
  let freetext = 0;
  let dropdown = 0;
  const filled = new Set();

  const exactKeys = [];
  const wildcardEntries = [];

  for (const key in pinneds) {
    if (Object.prototype.hasOwnProperty.call(pinneds, key)) {
      if (key.includes('*')) {
        wildcardEntries.push({ parts: key.split('|'), value: pinneds[key] });
      } else {
        exactKeys.push(key);
      }
    }
  }

  async function fillField(questionElement, value, respectInput = false) {
    if (respectInput && isFieldFilled(questionElement)) return;

    const field = detectFieldType(questionElement);
    if (!field) return;

    if (field.type === 'text') {
      fillTextarea(questionElement, value);
      freetext++;
    } else if (field.type === 'number') {
      fillNumberInput(questionElement, value);
      freetext++;
    } else if (field.type === 'radio') {
      fillRadioButton(questionElement, value);
      radio++;
    } else if (field.type === 'combobox') {
      await fillDropdowns(questionElement, value);
      dropdown++;
    }
  }

  for (const key of exactKeys) {
    const value = pinneds[key];
    const questionElement = document.querySelector(`[data-name="${CSS.escape(key)}"]`);
    if (!questionElement) continue;
    filled.add(key);
    await fillField(questionElement, value, respectInput);
  }

  if (wildcardEntries.length > 0) {
    const allElements = document.querySelectorAll('[data-name]');
    for (const el of allElements) {
      const dn = el.getAttribute('data-name');
      if (!dn || filled.has(dn)) continue;
      const nameParts = dn.split('|');
      for (const { parts, value } of wildcardEntries) {
        if (
          nameParts.length === parts.length &&
          parts.every((p, i) => p === '*' || p === nameParts[i])
        ) {
          filled.add(dn);
          await fillField(el, value, respectInput);
          break;
        }
      }
    }
  }

  return { radio, freetext, dropdown };
}

/**
 * Detect field type and return type with getValue callback.
 * This is the single source of truth for DOM field detection.
 *
 * @param {HTMLElement} questionElement - The question element container
 * @returns {{ type: string, getValue: Function }|null} Field object or null if not supported
 */
export function detectFieldType(questionElement) {
  // Check for combobox
  const dropdown = questionElement.querySelector('.sd-dropdown');
  if (dropdown) {
    return {
      type: 'combobox',
      getValue: () => {
        const valueElement = dropdown.querySelector('.sd-dropdown__value span.sv-string-viewer');
        return valueElement ? valueElement.textContent.trim() : null;
      },
    };
  }

  // Check for textarea
  const textInput = questionElement.querySelector(
    'textarea, input[type="text"]:not(.sd-dropdown__filter-string-input)',
  );
  if (textInput) {
    return {
      type: 'text',
      getValue: () => textInput.value,
    };
  }

  // Check for number input
  const numberInput = questionElement.querySelector('input[type="number"]');
  if (numberInput) {
    return {
      type: 'number',
      getValue: () => numberInput.value,
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
      },
    };
  }

  return null;
}

/**
 * Fill number input with the given value
 *
 * @param {HTMLElement} questionElement - The question element containing number input
 * @param {string} value - The value to fill
 */
function fillNumberInput(questionElement, value) {
  const inputElement = questionElement.querySelector('input[type="number"]');
  if (inputElement && inputElement.value !== String(value)) {
    inputElement.value = value;
    inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  }
}

/**
 * Fill textarea or text input with the given value
 *
 * @param {HTMLElement} questionElement - The question element containing textarea/input
 * @param {string} value - The value to fill
 */
function fillTextarea(questionElement, value) {
  const inputElement = questionElement.querySelector(
    'textarea, input[type="text"]:not(.sd-dropdown__filter-string-input)',
  );

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
function fillRadioButton(questionElement, targetLabel) {
  const radioLabels = questionElement.querySelectorAll('label.sd-selectbase__label');

  for (const label of radioLabels) {
    const labelTextElement = label.querySelector(
      'span.sd-item__control-label span.sv-string-viewer',
    );

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
async function fillDropdowns(questionElement, targetValue) {
  const chevronButton = questionElement.querySelector('.sd-dropdown_chevron-button');
  if (!chevronButton) return;

  const popups = document.querySelectorAll('.sv-popup--dropdown, .sv-popup--dropdown-overlay');
  const displayMap = [];
  popups.forEach((p) => {
    displayMap.push({ el: p, display: p.style.display });
    p.style.display = '';
  });

  const allOptions = Array.from(
    document.querySelectorAll(
      '.sv-popup--dropdown .sv-string-viewer, .sv-popup--dropdown-overlay .sv-string-viewer',
    ),
  );

  const targetOption = allOptions.find((span) => {
    const text = span.textContent.trim();
    return text === targetValue;
  });

  if (targetOption) {
    targetOption.closest('.sv-list__item').click();
  } else {
    displayMap.forEach(({ el, display }) => {
      el.style.display = display;
    });
  }
}
