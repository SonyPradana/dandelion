import { isInNotCheckedList, toggleNotCheckedItem } from '../utils/notChecked.js';

const TOGGLE_CLASS = 'dandelion-not-checked-toggle';

/**
 * Updates the visual representation of the toggle.
 * @param {HTMLElement} toggleElement - The element to update.
 * @param {boolean} isActive - Whether the item is currently in the list.
 */
function updateToggleState(toggleElement, isActive) {
  toggleElement.textContent = isActive ? '❌' : '➕';
}

/**
 * Handles the click event to add or remove an item from the master list.
 * @param {HTMLElement} toggleElement - The toggle element being clicked.
 * @param {string} identifier - The row ID associated with the toggle.
 */
async function handleToggle(toggleElement, identifier) {
  toggleElement.style.opacity = '0.5';
  try {
    const isNowActive = await toggleNotCheckedItem(identifier);
    updateToggleState(toggleElement, isNowActive);
  } finally {
    toggleElement.style.opacity = '1';
  }
}

/**
 * Creates a new toggle button instance for managing "Not Checked" list items.
 * @param {string} identifier - The row ID to be managed by this toggle.
 * @returns {HTMLSpanElement} The created toggle element.
 */
export function createNotCheckedToggle(identifier) {
  const toggle = document.createElement('span');
  toggle.className = TOGGLE_CLASS;
  toggle.style.cssText = `
    cursor: pointer;
    margin-left: 0.5rem;
    font-size: 0.6875rem;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    user-select: none;
    transition: opacity 0.2s ease;
  `;

  isInNotCheckedList(identifier).then((isActive) => {
    updateToggleState(toggle, isActive);
  });

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle(toggle, identifier);
  });

  return toggle;
}
