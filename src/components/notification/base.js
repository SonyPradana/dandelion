import { controlPanel } from '../controlPanel';

/**
 * Shared base for all Slot 3 panels (Status, Alert, Confirm, etc.)
 */
export function createBasePanel(id) {
  const styleId = 'dandelion-panel-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes dandelion-slide-in {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes dandelion-fade-out {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
      }
      .dandelion-panel-show {
        animation: dandelion-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .dandelion-panel-hide {
        animation: dandelion-fade-out 0.2s ease-in forwards;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  let panel = document.getElementById(id);

  if (!panel) {
    panel = document.createElement('div');
    panel.id = id;
    panel.classList.add('dandelion-panel-show');
    panel.style.cssText = `
      padding: 0.6rem 0.9rem;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border-radius: 10px;
      font-size: 0.6875rem;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 180px;
      max-width: 240px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
      pointer-events: auto;
      position: relative;
    `;

    const closeBtn = document.createElement('div');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 8px;
      cursor: pointer;
      opacity: 0.5;
      font-size: 14px;
      line-height: 1;
      transition: opacity 0.2s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.opacity = '1';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.opacity = '0.5';
    };
    closeBtn.onclick = () => {
      panel.classList.replace('dandelion-panel-show', 'dandelion-panel-hide');
      panel.addEventListener('animationend', () => panel.remove(), { once: true });
    };
    panel.appendChild(closeBtn);

    const content = document.createElement('div');
    content.className = 'dandelion-panel-content';
    content.style.width = '100%';
    panel.appendChild(content);
  }

  const contentArea = panel.querySelector('.dandelion-panel-content');
  controlPanel.mount(panel, 3);

  return {
    panel,
    contentArea,
    /**
     * @param {string} text
     * @param {string} color
     */
    setHeader(text, color = '#ffd700') {
      const el = document.createElement('div');
      el.className = 'dandelion-panel-header';
      el.style.cssText = `font-weight: bold; color: ${color}; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 4px; margin-bottom: 4px; font-size: 10px; letter-spacing: 0.5px;`;
      el.textContent = text.toUpperCase();
      return el;
    },
    remove() {
      if (panel.classList.contains('dandelion-panel-hide')) return;
      panel.classList.replace('dandelion-panel-show', 'dandelion-panel-hide');
      panel.addEventListener('animationend', () => panel.remove(), { once: true });
    },
  };
}

/**
 * Helper to create a styled button for panels
 */
export function createPanelButton(text, type = 'default') {
  const btn = document.createElement('button');
  btn.textContent = text;

  let colors = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: 'rgba(255, 255, 255, 0.2)',
    hover: 'rgba(255, 255, 255, 0.2)',
  };

  if (type === 'danger') {
    colors = {
      background: 'rgba(255, 77, 77, 0.15)',
      color: '#ff4d4d',
      border: 'rgba(255, 77, 77, 0.3)',
      hover: 'rgba(255, 77, 77, 0.3)',
    };
  } else if (type === 'success') {
    colors = {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#4ade80',
      border: 'rgba(34, 197, 94, 0.3)',
      hover: 'rgba(34, 197, 94, 0.3)',
    };
  }

  btn.style.cssText = `
    margin-top: 5px;
    padding: 6px;
    width: 100%;
    background: ${colors.background};
    color: ${colors.color};
    border: 1px solid ${colors.border};
    border-radius: 6px;
    font-size: 9px;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    pointer-events: auto;
  `;

  btn.onmouseover = () => {
    btn.style.background = colors.hover;
  };
  btn.onmouseout = () => {
    btn.style.background = colors.background;
  };

  return btn;
}
