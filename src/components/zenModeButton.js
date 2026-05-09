/**
 * Creates the Zen Mode toggle button.
 * @param {boolean} isActive - Initial active state.
 * @returns {HTMLButtonElement}
 */
export function zenModeButton(isActive = false) {
  const btn = document.createElement('button');
  btn.id = 'dandelion-zen-mode-toggle';
  btn.innerHTML = '⚡';
  btn.title = 'Zen Mode';

  const styleId = 'dandelion-zen-mode-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes dandelion-zen-border {
        0% { border-color: #3b82f6; box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
        50% { border-color: #60a5fa; box-shadow: 0 0 15px rgba(59, 130, 246, 0.8); }
        100% { border-color: #3b82f6; box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
      }
      .dandelion-zen-active {
        animation: dandelion-zen-border 1.5s infinite ease-in-out;
        background: rgba(59, 130, 246, 0.1) !important;
        border-width: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  const baseStyle = `
    padding: 0.3rem 0.75rem;
    background: rgba(255, 255, 255, 0.8);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    font-size: 0.875rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  `;

  btn.style.cssText = baseStyle;

  if (isActive) {
    btn.classList.add('dandelion-zen-active');
  }

  /**
   * Updates the button state.
   * @param {boolean} isDimmed
   */
  btn.setDimmed = (isDimmed) => {
    if (isDimmed) {
      btn.classList.add('dandelion-dimmed');
    } else {
      btn.classList.remove('dandelion-dimmed');
    }
  };

  /**
   * Toggles the active (animated) state.
   * @param {boolean} active
   */
  btn.setActive = (active) => {
    if (active) {
      btn.classList.add('dandelion-zen-active');
    } else {
      btn.classList.remove('dandelion-zen-active');
    }
  };

  btn.addEventListener('mousedown', () => {
    if (btn.classList.contains('dandelion-dimmed')) return;
    btn.style.transform = 'scale(0.95)';
  });

  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'scale(1)';
  });

  return btn;
}
