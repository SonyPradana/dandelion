import { controlPanel } from '../controlPanel';

/**
 * Shared base for all Slot 3 panels (Status, Alert, Confirm, etc.)
 */
export function createBasePanel(id) {
  let panel = document.getElementById(id);
  
  if (!panel) {
    panel = document.createElement('div');
    panel.id = id;
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
    `;
  }

  controlPanel.mount(panel, 3);

  return {
    panel,
    /**
     * @param {string} text 
     * @param {string} color 
     */
    setHeader(text, color = '#ffd700') {
      const headerHtml = `<div class="dandelion-panel-header" style="font-weight: bold; color: ${color}; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 4px; margin-bottom: 4px; font-size: 10px; letter-spacing: 0.5px;">${text.toUpperCase()}</div>`;
      return headerHtml;
    },
    remove() {
      panel.remove();
    }
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
    hover: 'rgba(255, 255, 255, 0.2)'
  };

  if (type === 'danger') {
    colors = {
      background: 'rgba(255, 77, 77, 0.15)',
      color: '#ff4d4d',
      border: 'rgba(255, 77, 77, 0.3)',
      hover: 'rgba(255, 77, 77, 0.3)'
    };
  } else if (type === 'success') {
    colors = {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#4ade80',
      border: 'rgba(34, 197, 94, 0.3)',
      hover: 'rgba(34, 197, 94, 0.3)'
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
  `;

  btn.onmouseover = () => {
    btn.style.background = colors.hover;
  };
  btn.onmouseout = () => {
    btn.style.background = colors.background;
  };

  return btn;
}
