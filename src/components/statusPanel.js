const STATUS_PANEL_ID = 'dandelion-status-panel';

/**
 * Creates or updates the status panel.
 * @param {number} done - Number of items completed.
 * @param {number} total - Total items in the current task.
 * @param {boolean} isProcessing - Whether the bot is currently active.
 * @returns {HTMLDivElement}
 */
export function updateStatusPanel(done, total, isProcessing) {
  let panel = document.getElementById(STATUS_PANEL_ID);

  if (!panel) {
    panel = document.createElement('div');
    panel.id = STATUS_PANEL_ID;
    panel.style.cssText = `
      position: fixed;
      top: 7rem;
      right: 0.75rem;
      z-index: 9997;
      padding: 0.5rem 0.75rem;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: 8px;
      font-size: 0.6875rem;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 100px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(panel);
  }

  panel.innerHTML = `
    <div style="font-weight: bold; color: #ffd700;">Dandelion running</div>
    <div>Progress: ${done}/${total}</div>
    <div style="font-size: 0.7rem; opacity: 0.8;">${isProcessing ? '⏳ Processing...' : '✅ All Done'}</div>
  `;

  return panel;
}

/**
 * Removes the status panel with an optional delay.
 * @param {number} delay - Delay in milliseconds before removal.
 */
export function removeStatusPanel(delay = 0) {
  const panel = document.getElementById(STATUS_PANEL_ID);
  if (!panel) return;

  if (delay > 0) {
    panel.innerHTML = `
      <div style="font-weight: bold; color: #00ff00;">Task Finished</div>
      <div>Done ✓</div>
    `;
    setTimeout(() => panel.remove(), delay);
  } else {
    panel.remove();
  }
}
