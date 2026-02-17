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
 * Detect field type and return appropriate element
 * @param {HTMLElement} questionElement - The question element container
 * @returns {Object|null} Object with type and element, or null if not supported
 */
function detectFieldType (questionElement) {
  // Check for textarea or text input
  const textInput = questionElement.querySelector('textarea, input[type="text"]:not(.sd-dropdown__filter-string-input)');
  if (textInput) {
    return { type: 'text', element: questionElement };
  }

  // Check for radio button
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
 * Handles the toggle pin action.
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {string} identifier - The identifier for the item to toggle.
 * @param {Object} field - The field object with type and element.
 */
async function handleToggle (toggleElement, identifier, field) {
  toggleElement.classList.add('loading');

  try {
    const currentPinned = await isPinned(identifier);
    const nowPinned = !currentPinned;

    if (nowPinned) {
      // Pin: save current value as snapshot
      const currentValue = getCurrentValue(field.element);
      if (currentValue !== null) {
        await addPinnedItem(identifier, currentValue);
      }
    } else {
      // Unpin: remove from storage
      await removePinnedItem(identifier);
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
