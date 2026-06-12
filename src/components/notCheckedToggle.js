const TOGGLE_CLASS = 'dandelion-not-checked-toggle';

function updateToggleState(toggleElement, isActive) {
  toggleElement.textContent = isActive ? '❌' : '➕';
}

/**
 * @param {string} identifier - The row ID to be managed by this toggle.
 * @param {Object} [options]
 * @param {boolean} [options.initialChecked]
 * @param {(id: string) => Promise<boolean>} [options.onToggle]
 *   Async fn that toggles and returns the new state
 * @returns {HTMLSpanElement}
 */
export function createNotCheckedToggle(identifier, { initialChecked, onToggle } = {}) {
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

  if (initialChecked !== undefined) {
    updateToggleState(toggle, initialChecked);
  }

  async function handleToggle() {
    if (!onToggle) return;
    toggle.style.opacity = '0.5';
    try {
      const isNowActive = await onToggle(identifier);
      updateToggleState(toggle, isNowActive);
    } finally {
      toggle.style.opacity = '1';
    }
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle();
  });

  return toggle;
}
