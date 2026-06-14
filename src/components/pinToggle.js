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

function updateToggleState(toggleElement, pinned) {
  toggleElement.textContent = '📌';
  toggleElement.classList.toggle('active', pinned);
  toggleElement.setAttribute('aria-label', pinned ? 'Unpin this field' : 'Pin this field');
}

/**
 * @param {string} identifier
 * @param {() => string|null} getValue - Callback to get current field value
 * @param {Object} [options]
 * @param {boolean} [options.initialPinned]
 * @param {(id: string, value: string|null) => Promise<boolean>} [options.onToggle]
 *   Async fn that toggles pin state and returns the new pinned state
 * @returns {HTMLSpanElement}
 */
export function createPinToggle(identifier, getValue, { initialPinned, onToggle } = {}) {
  initializeStyles();

  const toggleEl = document.createElement('span');
  toggleEl.className = PIN_TOGGLE_CLASS;
  toggleEl.setAttribute('role', 'button');
  toggleEl.setAttribute('tabindex', '0');

  if (initialPinned !== undefined) {
    updateToggleState(toggleEl, initialPinned);
  } else {
    toggleEl.style.opacity = '0.3';
  }

  async function handleToggle() {
    if (!onToggle) return;
    toggleEl.classList.add('loading');
    try {
      const currentValue = getValue();
      const nowPinned = await onToggle(identifier, currentValue);
      updateToggleState(toggleEl, nowPinned);
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toggleEl.textContent = '⚠️';
      toggleEl.setAttribute('aria-label', 'Error toggling pin state');
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
