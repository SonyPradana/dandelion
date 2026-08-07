import { controlPanel } from './controlPanel.js';
import { refreshState } from '../refreshState.js';

export const RELOAD_BTN_ID = 'dandelion-reload-btn';
const SPIN_CLASS = 'dandelion-reload-spinning';
const SETTLE_TRANSITION = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
let stylesInitialized = false;

function initializeStyles() {
  if (stylesInitialized) return;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes dandelion-reload-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .${SPIN_CLASS} {
      animation: dandelion-reload-spin 0.8s linear infinite;
    }
  `;
  document.head.appendChild(styleSheet);
  stylesInitialized = true;
}

export function reloadButton() {
  initializeStyles();

  const btn = document.createElement('button');
  btn.id = RELOAD_BTN_ID;
  btn.dataset.pinned = 'true';
  btn.title = 'Reload state';
  btn.textContent = '↻';
  btn.style.cssText = `
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.85);
    color: #171717;
    border: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 0.875rem;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  `;

  btn.spin = () => {
    btn.style.transform = '';
    btn.style.transition = '';
    btn.classList.add(SPIN_CLASS);
  };

  btn.stopSpin = () => {
    btn.classList.remove(SPIN_CLASS);
    btn.style.transition = SETTLE_TRANSITION;
    btn.style.transform = 'rotate(360deg)';
  };

  btn.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'transform') {
      btn.style.transform = '';
      btn.style.transition = '';
    }
  });

  btn.addEventListener('click', () => {
    btn.spin();
    refreshState()
      .catch((error) => console.error('[Dandelion] reload error:', error))
      .finally(() => btn.stopSpin());
  });

  return btn;
}

export function ensureReloadButton() {
  const btn = document.getElementById(RELOAD_BTN_ID) || reloadButton();
  if (!document.getElementById(RELOAD_BTN_ID)) {
    controlPanel.mount(btn, 3);
  }

  return btn;
}
