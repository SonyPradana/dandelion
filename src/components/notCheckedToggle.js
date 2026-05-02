import { getFullConfig, setConfig } from '../configuration.js';
import { isInNotCheckedList, toggleNotCheckedLogic } from '../utils/notChecked.js';

const TOGGLE_CLASS = 'dandelion-not-checked-toggle';

function updateToggleState(toggleElement, isActive) {
  toggleElement.textContent = isActive ? '❌' : '➕';
}

async function handleToggle(toggleElement, identifier) {
  toggleElement.style.opacity = '0.5';
  try {
    const fullConfig = await getFullConfig();
    const activeProfile = fullConfig.activeProfile;
    const currentList = fullConfig.profiles[activeProfile].notCheckedList || '';

    const { updatedList, nowPresent } = toggleNotCheckedLogic(identifier, currentList);

    fullConfig.profiles[activeProfile].notCheckedList = updatedList;
    await setConfig(fullConfig);

    updateToggleState(toggleElement, nowPresent);
  } catch (error) {
    console.error('Dandelion: Failed to toggle not-checked item:', error);
  } finally {
    toggleElement.style.opacity = '1';
  }
}

export function createNotCheckedToggle(identifier, profileConfig, initialIsActive) {
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

  if (initialIsActive !== undefined) {
    updateToggleState(toggle, initialIsActive);
  } else {
    updateToggleState(toggle, isInNotCheckedList(identifier, profileConfig));
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle(toggle, identifier);
  });

  return toggle;
}
