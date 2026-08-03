import { h } from '../utils/dom';

/**
 * Creates the "Terapkan" button for applying a token from a share page.
 * Disabled by default and only enabled after the token has been pre-verified.
 * @returns {HTMLButtonElement}
 */
export function shareTokenButton() {
  const styleId = 'dandelion-share-token-style';
  if (!document.getElementById(styleId)) {
    document.head.appendChild(
      h('style', {
        id: styleId,
        textContent: `
      #dandelion-share-token-apply:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        filter: grayscale(1);
      }
      #dandelion-share-token-apply:not(:disabled) {
        animation: dandelion-glow 2s ease-in-out infinite;
      }
      @keyframes dandelion-glow {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(34, 197, 94, 0.5);
        }
        50% {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 18px 4px rgba(34, 197, 94, 0.45);
        }
      }
        .dandelion-running {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          filter: grayscale(1) !important;
          pointer-events: none !important;
          animation: none !important;
        }
      `,
      }),
    );
  }

  const baseStyle = `
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.85);
    color: #15803d;
    border: 1px solid rgba(34, 197, 94, 0.4);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
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

  const btn = h('button', {
    id: 'dandelion-share-token-apply',
    textContent: '🚀 Terapkan',
    title: 'Terapkan token share',
    disabled: true,
    style: baseStyle,
  });

  /**
   * Enables or disables the button.
   * @param {boolean} enabled
   */
  btn.setEnabled = (enabled) => {
    btn.disabled = !enabled;
  };

  /**
   * Toggles the running state while applying.
   * @param {boolean} running
   */
  btn.setRunning = (running) => {
    btn.classList.toggle('dandelion-running', running);
  };

  btn.reset = () => {
    btn.disabled = true;
    btn.classList.remove('dandelion-running');
  };

  return btn;
}
