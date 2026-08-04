import { h } from '../utils/dom';

/**
 * Creates the Zero (combined) mode toggle button.
 * White base with bold black "Zero" text.
 * @param {boolean} isActive - Initial active state.
 * @returns {HTMLButtonElement}
 */
export function zeroButton(isActive = false) {
  const styleId = 'dandelion-zero-mode-style';
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

  const btn = h(
    'button',
    {
      id: 'dandelion-zero-toggle',
      title: 'Zero Mode',
      style: {
        padding: '0.75rem 1.25rem',
        background: '#ffffff',
        color: '#000000',
        border: '1px solid rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      },
    },
    'Zero',
  );

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
   * Updates the running state.
   * @param {boolean} isRunning
   */
  btn.setRunning = (isRunning) => {
    if (isRunning) {
      btn.classList.add('dandelion-running');
    } else {
      btn.classList.remove('dandelion-running');
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

  btn.reset = () => {
    btn.classList.remove('dandelion-dimmed', 'dandelion-running', 'dandelion-zen-active');
  };

  btn.addEventListener('mousedown', () => {
    if (btn.classList.contains('dandelion-dimmed') || btn.classList.contains('dandelion-running')) {
      return;
    }
    btn.style.transform = 'scale(0.95)';
  });

  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'scale(1)';
  });

  return btn;
}
