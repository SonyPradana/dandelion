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
 * Updates the pin toggle button state.
 *
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {boolean} pinned - Whether the item is pinned.
 */
function updateToggleState (toggleElement, pinned) {
  toggleElement.textContent = '📌';
  toggleElement.classList.toggle('active', pinned);
  toggleElement.setAttribute('aria-label', pinned ? 'Unpin this field' : 'Pin this field');
}

/**
 * Handles the toggle pin action.
 *
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {string} identifier - The data-name identifier.
 * @param {Function} getValue - Callback to get current field value.
 */
async function handleToggle (toggleElement, identifier, getValue) {
  toggleElement.classList.add('loading');

  try {
    const currentPinned = await isPinned(identifier);
    const nowPinned = !currentPinned;

    if (nowPinned) {
      const currentValue = getValue();
      if (currentValue !== null) {
        await addPinnedItem(identifier, currentValue);
      }
    } else {
      await removePinnedItem(identifier);
    }

    updateToggleState(toggleElement, nowPinned);
  } catch (error) {
    console.error('Failed to toggle pin:', error);
    toggleElement.textContent = '⚠️';
    toggleElement.setAttribute('aria-label', 'Error toggling pin state');
  } finally {
    toggleElement.classList.remove('loading');
  }
}

/**
 * Creates a toggle button to pin a field value.
 * Does not query the DOM directly - relies on getValue callback provided by the caller.
 *
 * @param {string} identifier - The data-name for the element.
 * @param {Function} getValue - Callback that returns the current field value.
 * @returns {Promise<HTMLSpanElement>} The created pin toggle element.
 */
export async function createPinToggle (identifier, getValue) {
  initializeStyles();

  const pinToggle = document.createElement('span');
  pinToggle.className = PIN_TOGGLE_CLASS;
  pinToggle.setAttribute('role', 'button');
  pinToggle.setAttribute('tabindex', '0');

  isPinned(identifier)
    .then(pinned => {
      updateToggleState(pinToggle, pinned);
    })
    .catch(error => {
      console.error('Failed to check pin state:', error);
      pinToggle.textContent = '⚠️';
      pinToggle.setAttribute('aria-label', 'Error loading pin state');
    });

  pinToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle(pinToggle, identifier, getValue);
  });

  pinToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleToggle(pinToggle, identifier, getValue);
    }
  });

  return pinToggle;
}
