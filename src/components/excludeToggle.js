import { isExcluded, toggleExclude } from '../utils/excludes.js';

const EXCLUDE_TOGGLE_CLASS = 'dandelion-exclude-toggle';

// Initialize styles once
let stylesInitialized = false;

function initializeStyles () {
  if (stylesInitialized) return;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .${EXCLUDE_TOGGLE_CLASS} {
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
      transition: opacity 0.2s ease;
    }

    .${EXCLUDE_TOGGLE_CLASS}:hover {
      background-color: rgba(0, 0, 0, 0.12);
    }

    .${EXCLUDE_TOGGLE_CLASS}:focus {
      outline: 2px solid #161616;
      outline-offset: 1px;
    }

    .${EXCLUDE_TOGGLE_CLASS}.loading {
      opacity: 0.5;
      pointer-events: none;
    }
  `;
  document.head.appendChild(styleSheet);
  stylesInitialized = true;
}

/**
 * Updates the exclude toggle button state.
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {boolean} isExcluded - Whether the item is excluded.
 */
function updateToggleState (toggleElement, isExcluded) {
  toggleElement.textContent = isExcluded ? '❌' : '➕';
  toggleElement.setAttribute(
    'aria-label',
    isExcluded ? 'Include this question' : 'Exclude this question'
  );
}

/**
 * Handles the toggle exclude action.
 * @param {HTMLElement} toggleElement - The toggle button element.
 * @param {string} identifier - The identifier for the item to toggle.
 */
async function handleToggle (toggleElement, identifier) {
  toggleElement.classList.add('loading');

  try {
    const nowExcluded = await toggleExclude(identifier);
    updateToggleState(toggleElement, nowExcluded);
  } catch (error) {
    console.error('Failed to toggle exclude:', error);
    toggleElement.textContent = '⚠️';
    toggleElement.setAttribute('aria-label', 'Error toggling exclude state');
  } finally {
    toggleElement.classList.remove('loading');
  }
}

/**
 * Creates an exclude toggle button element.
 * @param {string} identifier - The identifier for the item.
 * @returns {HTMLSpanElement} The created toggle button.
 */
export function createExcludeToggle (identifier) {
  initializeStyles();

  const excludeToggle = document.createElement('span');
  excludeToggle.className = EXCLUDE_TOGGLE_CLASS;
  excludeToggle.setAttribute('role', 'button');
  excludeToggle.setAttribute('tabindex', '0');

  // Initialize state
  isExcluded(identifier)
    .then(excluded => updateToggleState(excludeToggle, excluded))
    .catch(error => {
      console.error('Failed to check exclude state:', error);
      excludeToggle.textContent = '⚠️';
      excludeToggle.setAttribute('aria-label', 'Error loading exclude state');
    });

  // Click handler
  excludeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle(excludeToggle, identifier);
  });

  // Keyboard handler
  excludeToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleToggle(excludeToggle, identifier);
    }
  });

  return excludeToggle;
}
