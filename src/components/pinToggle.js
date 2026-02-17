import { addPinnedItem, removePinnedItem, isPinned } from '../utils/pinneds.js';

const PIN_TOGGLE_CLASS = 'dandelion-pin-toggle';

let stylesInitialized = false;

function initializeStyles () {
  if (stylesInitialized) return;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .${PIN_TOGGLE_CLASS} {
      cursor: pointer;
      font-size: 0.6875rem;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-weight: 500;
      line-height: 1.2;
      background-color: transparent;
      color: #525252;
      padding: 0 4px;
      border-radius: 3px;
      flex-shrink: 0;
      transition: opacity 0.2s ease, color 0.2s ease;
      opacity: 0.5;
    }
    .${PIN_TOGGLE_CLASS}:hover {
      background-color: rgba(0, 0, 0, 0.12);
    }
    .${PIN_TOGGLE_CLASS}:focus {
      outline: 2px solid #161616;
      outline-offset: 1px;
    }
    .${PIN_TOGGLE_CLASS}.active {
      opacity: 1;
      color: #161616;
    }
    .${PIN_TOGGLE_CLASS}.loading {
      opacity: 0.5;
      pointer-events: none;
    }
  `;
  document.head.appendChild(styleSheet);
  stylesInitialized = true;
}

/**
 * Get the current value from a field (textarea, text input, or radio button)
 * @param {HTMLElement} questionElement - The question element container
 * @returns {string|null} The current value or null if not found
 */
function getCurrentValue (questionElement) {
  const textInput = questionElement.querySelector('textarea, input[type="text"]:not(.sd-dropdown__filter-string-input)');
  if (textInput) {
    return textInput.value;
  }

  const checkedRadio = questionElement.querySelector('input[type="radio"]:checked');
  if (checkedRadio) {
    const label = checkedRadio.closest('label.sd-selectbase__label');
    if (label) {
      const labelText = label.querySelector('span.sd-item__control-label span.sv-string-viewer');
      if (labelText) {
        return labelText.textContent.trim();
      }
    }
  }

  return null;
}

/**
 * Detect field type and return appropriate input element
 * @param {HTMLElement} questionElement - The question element container
 * @returns {Object|null} Object with type and element, or null if not supported
 */
function detectFieldType (questionElement) {
  const textInput = questionElement.querySelector('textarea, input[type="text"]:not(.sd-dropdown__filter-string-input)');
  if (textInput) {
    return { type: 'text', element: textInput };
  }

  const radioInputs = questionElement.querySelectorAll('input[type="radio"]');
  if (radioInputs.length > 0) {
    return { type: 'radio', element: questionElement };
  }

  return null;
}

/**
 * Updates the pin toggle button state.
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {boolean} isPinned - Whether the item is pinned.
 * @param {string} fieldType - The type of field ('text' or 'radio')
 */
function updateToggleState (toggleElement, isPinned, fieldType = 'text') {
  toggleElement.textContent = '📌';
  toggleElement.classList.toggle('active', isPinned);

  const fieldLabel = fieldType === 'radio' ? 'radio button' : 'freetext';
  toggleElement.setAttribute(
    'aria-label',
    isPinned ? `Unpin this ${fieldLabel}` : `Pin this ${fieldLabel}`
  );
}

/**
 * Set up listener for text input changes
 *
 * @param {HTMLElement} inputElement - The input element
 * @param {string} identifier - The data-name identifier
 */
function setupTextInputListener (inputElement, identifier) {
  const updateStorage = () => {
    addPinnedItem(identifier, inputElement.value);
  };

  inputElement.addEventListener('input', updateStorage);

  return () => {
    inputElement.removeEventListener('input', updateStorage);
  };
}

/**
 * Set up listener for radio button changes
 *
 * @param {HTMLElement} questionElement - The question element container
 * @param {string} identifier - The data-name identifier
 */
function setupRadioListener (questionElement, identifier) {
  const radioInputs = questionElement.querySelectorAll('input[type="radio"]');

  const updateStorage = (event) => {
    const radio = event.target;
    if (radio.checked) {
      const label = radio.closest('label.sd-selectbase__label');
      if (label) {
        const labelText = label.querySelector('span.sd-item__control-label span.sv-string-viewer');
        if (labelText) {
          addPinnedItem(identifier, labelText.textContent.trim());
        }
      }
    }
  };

  radioInputs.forEach(radio => {
    radio.addEventListener('change', updateStorage);
  });

  return () => {
    radioInputs.forEach(radio => {
      radio.removeEventListener('change', updateStorage);
    });
  };
}

/**
 * Handles the toggle pin action.
 *
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {string} identifier - The identifier for the item to toggle.
 * @param {Object} field - The field object with type and element.
 * @param {Function|null} cleanupListener - Function to cleanup existing listener.
 */
async function handleToggle (toggleElement, identifier, field, cleanupListener) {
  toggleElement.classList.add('loading');

  try {
    const currentPinned = await isPinned(identifier);
    const nowPinned = !currentPinned;

    if (nowPinned) {
      const currentValue = getCurrentValue(field.element.closest ? field.element.closest('[data-name]') : field.element.parentElement.closest('[data-name]'));
      if (currentValue) {
        await addPinnedItem(identifier, currentValue);
      }

      if (field.type === 'text') {
        field.cleanup = setupTextInputListener(field.element, identifier);
      } else if (field.type === 'radio') {
        field.cleanup = setupRadioListener(field.element, identifier);
      }
    } else {
      await removePinnedItem(identifier);

      if (field.cleanup) {
        field.cleanup();
        field.cleanup = null;
      }
    }

    updateToggleState(toggleElement, nowPinned, field.type);
  } catch (error) {
    console.error('Failed to toggle pin:', error);
    toggleElement.textContent = '⚠️';
    toggleElement.setAttribute('aria-label', 'Error toggling pin state');
  } finally {
    toggleElement.classList.remove('loading');
  }
}

/**
 * Creates a toggle button to pin field content (textarea, text input, or radio button).
 *
 * @param {string} identifier - The data-name for the element.
 * @returns {Promise<HTMLSpanElement>} The created pin toggle element.
 */
export async function createPinToggle (identifier) {
  initializeStyles();

  const pinToggle = document.createElement('span');
  pinToggle.className = PIN_TOGGLE_CLASS;
  pinToggle.setAttribute('role', 'button');
  pinToggle.setAttribute('tabindex', '0');

  const questionElement = document.querySelector(`[data-name="${identifier}"]`);
  const field = questionElement ? detectFieldType(questionElement) : null;

  if (!field) {
    pinToggle.style.display = 'none';
    return pinToggle;
  }

  isPinned(identifier)
    .then(pinned => {
      updateToggleState(pinToggle, pinned, field.type);
      if (pinned) {
        if (field.type === 'text') {
          field.cleanup = setupTextInputListener(field.element, identifier);
        } else if (field.type === 'radio') {
          field.cleanup = setupRadioListener(field.element, identifier);
        }
      }
    })
    .catch(error => {
      console.error('Failed to check pin state:', error);
      pinToggle.textContent = '⚠️';
      pinToggle.setAttribute('aria-label', 'Error loading pin state');
    });

  pinToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle(pinToggle, identifier, field);
  });

  pinToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleToggle(pinToggle, identifier, field);
    }
  });

  return pinToggle;
}
