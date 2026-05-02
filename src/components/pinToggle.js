import { configManager } from '../configuration.js';
import { isPinned, addPinnedItemLogic, removePinnedItemLogic, getPinnedItems } from '../utils/pinneds.js';

const PIN_TOGGLE_CLASS = 'dandelion-pin-toggle';

let stylesInitialized = false;

function initializeStyles() {
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
    .${PIN_TOGGLE_CLASS}:hover { background-color: rgba(0, 0, 0, 0.12); }
    .${PIN_TOGGLE_CLASS}.active { opacity: 1; color: #161616; }
    .${PIN_TOGGLE_CLASS}.loading { opacity: 0.5; pointer-events: none; }
  `;
  document.head.appendChild(styleSheet);
  stylesInitialized = true;
}

function updateToggleState(toggleElement, pinned) {
  toggleElement.textContent = '📌';
  toggleElement.classList.toggle('active', pinned);
  toggleElement.setAttribute('aria-label', pinned ? 'Unpin this field' : 'Pin this field');
}

async function handleToggle(toggleElement, identifier, getValue) {
  toggleElement.classList.add('loading');
  try {
    const fullConfig = configManager.data;
    const activeProfile = fullConfig.activeProfile;
    const profile = fullConfig.profiles[activeProfile];
    const currentPinneds = getPinnedItems(profile);

    const alreadyPinned = Object.prototype.hasOwnProperty.call(currentPinneds, identifier);
    let updatedPinneds = null;

    if (alreadyPinned) {
      updatedPinneds = removePinnedItemLogic(identifier, currentPinneds);
    } else {
      const value = getValue();
      if (value === null) return;
      updatedPinneds = addPinnedItemLogic(identifier, value, currentPinneds);
    }

    fullConfig.profiles[activeProfile].pinneds = updatedPinneds;
    await configManager.sync();

    updateToggleState(toggleElement, !alreadyPinned);
  } catch (error) {
    console.error('Dandelion: Failed to toggle pin:', error);
    toggleElement.textContent = '⚠️';
  } finally {
    toggleElement.classList.remove('loading');
  }
}

export async function createPinToggle(identifier, getValue, profileConfig, initialIsPinned) {
  initializeStyles();

  const pinToggle = document.createElement('span');
  pinToggle.className = PIN_TOGGLE_CLASS;
  pinToggle.setAttribute('role', 'button');
  pinToggle.setAttribute('tabindex', '0');

  if (initialIsPinned !== undefined) {
    updateToggleState(pinToggle, initialIsPinned);
  } else {
    updateToggleState(pinToggle, isPinned(identifier, profileConfig));
  }

  pinToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle(pinToggle, identifier, getValue);
  });

  return pinToggle;
}
