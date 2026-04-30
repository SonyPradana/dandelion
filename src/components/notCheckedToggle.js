import { isInNotCheckedList, toggleNotCheckedItem } from '../utils/notChecked.js';

const TOGGLE_CLASS = 'dandelion-not-checked-toggle';

function updateToggleState(toggleElement, isActive) {
  toggleElement.textContent = isActive ? '❌' : '➕';
}

async function handleToggle(toggleElement, identifier) {
  toggleElement.style.opacity = '0.5';
  try {
    const isNowActive = await toggleNotCheckedItem(identifier);
    updateToggleState(toggleElement, isNowActive);
  } catch (error) {
    console.error('Failed to toggle notChecked item:', error);
  } finally {
    toggleElement.style.opacity = '1';
  }
}

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
