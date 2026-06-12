const EXCLUDE_TOGGLE_CLASS = 'dandelion-exclude-toggle';

let stylesInitialized = false;

function initializeStyles() {
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

function updateToggleState(toggleElement, isExcluded) {
  toggleElement.textContent = isExcluded ? '❌' : '➕';
  toggleElement.setAttribute(
    'aria-label',
    isExcluded ? 'Include this question' : 'Exclude this question',
  );
}

/**
 * Creates an exclude toggle button element.
 * @param {string} identifier
 * @param {Object} [options]
 * @param {boolean} [options.initialExcluded]
 * @param {(id: string) => Promise<boolean>} [options.onToggle] - Async fn that toggles and returns new state
 * @returns {HTMLSpanElement}
 */
export function createExcludeToggle(identifier, { initialExcluded, onToggle } = {}) {
  initializeStyles();

  const toggleEl = document.createElement('span');
  toggleEl.className = EXCLUDE_TOGGLE_CLASS;
  toggleEl.setAttribute('role', 'button');
  toggleEl.setAttribute('tabindex', '0');

  if (initialExcluded !== undefined) {
    updateToggleState(toggleEl, initialExcluded);
  } else {
    toggleEl.textContent = '⋯';
  }

  async function handleToggle() {
    if (!onToggle) return;
    toggleEl.classList.add('loading');
    try {
      const nowExcluded = await onToggle(identifier);
      updateToggleState(toggleEl, nowExcluded);
    } catch (error) {
      console.error('Failed to toggle exclude:', error);
      toggleEl.textContent = '⚠️';
      toggleEl.setAttribute('aria-label', 'Error toggling exclude state');
    } finally {
      toggleEl.classList.remove('loading');
    }
  }

  toggleEl.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle();
  });

  toggleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleToggle();
    }
  });

  return toggleEl;
}
