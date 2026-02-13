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
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {boolean} isPinned - Whether the item is pinned.
 */
function updateToggleState (toggleElement, isPinned) {
  toggleElement.textContent = '📌';
  toggleElement.classList.toggle('active', isPinned);
  toggleElement.setAttribute(
    'aria-label',
    isPinned ? 'Unpin this freetext' : 'Pin this freetext'
  );
}

/**
 * Handles the toggle pin action.
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {string} identifier - The identifier for the item to toggle.
 * @param {HTMLElement} inputElement - The associated input element.
 */
async function handleToggle (toggleElement, identifier, inputElement) {
  toggleElement.classList.add('loading');

  try {
    const currentPinned = await isPinned(identifier);
    const nowPinned = !currentPinned;

    if (nowPinned) {
      await addPinnedItem(identifier, inputElement.value);
      inputElement.addEventListener('input', updateStorageOnInput);
    } else {
      await removePinnedItem(identifier);
      inputElement.removeEventListener('input', updateStorageOnInput);
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
 * Updates storage when input changes.
 * @param {Event} event - The input event.
 */
function updateStorageOnInput (event) {
  const identifier = event.target.closest('[data-name]')?.getAttribute('data-name');
  if (identifier) {
    addPinnedItem(identifier, event.target.value);
  }
}

/**
 * Creates a toggle button to pin freetext content.
 * @param {string} identifier - The data-name for the element.
 * @returns {Promise<HTMLSpanElement>} The created pin toggle element.
 */
export async function createPinToggle (identifier) {
  initializeStyles();

  const pinToggle = document.createElement('span');
  pinToggle.className = PIN_TOGGLE_CLASS;
  pinToggle.setAttribute('role', 'button');
  pinToggle.setAttribute('tabindex', '0');

  // Find the associated textarea/input
  const questionElement = document.querySelector(`[data-name="${identifier}"]`);
  const inputElement = questionElement ? questionElement.querySelector('textarea, input[type="text"]') : null;

  if (!inputElement) {
    pinToggle.style.display = 'none';
    return pinToggle;
  }

  isPinned(identifier)
    .then(pinned => {
      updateToggleState(pinToggle, pinned);
      if (pinned) {
        inputElement.addEventListener('input', updateStorageOnInput);
      }
    })
    .catch(error => {
      console.error('Failed to check pin state:', error);
      pinToggle.textContent = '⚠️';
      pinToggle.setAttribute('aria-label', 'Error loading pin state');
    });

  pinToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle(pinToggle, identifier, inputElement);
  });

  pinToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleToggle(pinToggle, identifier, inputElement);
    }
  });

  return pinToggle;
}
