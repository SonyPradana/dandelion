import { isExcluded, toggleExclude } from '../utils/excludes.js';

const DEBUG_MARKER_CLASS = 'dandelion-debug-marker';
const EXCLUDE_TOGGLE_CLASS = 'dandelion-exclude-toggle';

// Initialize styles once
let stylesInitialized = false;

function initializeStyles () {
  if (stylesInitialized) return;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .${DEBUG_MARKER_CLASS} {
      position: absolute;
      top: -10px;
      left: 0;
      background-color: rgba(253, 255, 153, 0.9);
      color: #171717;
      padding: 0.125rem 0.3125rem;
      font-size: 0.625rem;
      font-family: monospace;
      border: 1px solid rgba(0, 0, 0, 0.1);
      z-index: 9990;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 5px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    .${EXCLUDE_TOGGLE_CLASS} {
      cursor: pointer;
      font-weight: bold;
      background-color: transparent;
      color: #666;
      padding: 0 4px;
      border-radius: 3px;
      flex-shrink: 0;
      transition: opacity 0.2s ease;
    }

    .${EXCLUDE_TOGGLE_CLASS}:hover {
      background-color: rgba(0, 0, 0, 0.1);
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
function createExcludeToggle (identifier) {
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

/**
 * Creates a debug marker element with specific styling, including an exclude toggle.
 * @param {string} identifier - The text to display inside the marker and the data-name for the exclude toggle.
 * @returns {HTMLDivElement} The created marker element.
 */
export function debugMarker (identifier) {
  initializeStyles();

  const marker = document.createElement('div');
  marker.className = DEBUG_MARKER_CLASS;
  marker.textContent = identifier;

  const excludeToggle = createExcludeToggle(identifier);
  marker.appendChild(excludeToggle);

  return marker;
}
