const STATUS_PANEL_ID = 'dandelion-status-panel';

/**
 * Creates or updates the status panel.
 * @param {number} done - Number of items completed or remaining.
 * @param {number} total - Total items.
 * @param {boolean|string} status - Processing status or custom text.
 * @param {Object} [options] - Additional options.
 * @param {string} [options.title] - Custom title for the panel.
 * @param {Function} [options.onDelete] - Callback for the delete button.
 * @returns {HTMLDivElement}
 */
export function updateStatusPanel(done, total, status, options = {}) {
  let panel = document.getElementById(STATUS_PANEL_ID);
  const { title, onDelete } = options;

  if (!panel) {
    panel = document.createElement('div');
    panel.id = STATUS_PANEL_ID;
    panel.style.cssText = `
      position: fixed;
      top: 7rem;
      right: 0.75rem;
      z-index: 9997;
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
      min-width: 160px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    document.body.appendChild(panel);
  }

  // Always enable pointer events if onDelete is provided, otherwise disable
  panel.style.pointerEvents = onDelete ? 'auto' : 'none';

  let statusText = status;
  if (typeof status === 'boolean') {
    statusText = status ? '⏳ Sedang diproses...' : '✅ Selesai';
  }

  const titleText = title || 'Status Tugas';
  const titleColor = onDelete ? '#ff4d4d' : '#ffd700';

  panel.innerHTML = `
    <div style="font-weight: bold; color: ${titleColor}; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 4px; margin-bottom: 4px; font-size: 10px; letter-spacing: 0.5px;">${titleText.toUpperCase()}</div>
    <div style="display: flex; justify-content: space-between; gap: 15px; align-items: center;">
      <span style="opacity: 0.8;">Progres</span>
      <span style="font-weight: bold; font-size: 12px;">${done}/${total}</span>
    </div>
    <div style="font-size: 0.6rem; opacity: 0.7; font-style: italic;">${statusText}</div>
  `;

  if (onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'HENTIKAN & HAPUS';
    deleteBtn.style.cssText = `
      margin-top: 8px;
      padding: 6px;
      width: 100%;
      background: rgba(255, 77, 77, 0.15);
      color: #ff4d4d;
      border: 1px solid rgba(255, 77, 77, 0.3);
      border-radius: 6px;
      font-size: 9px;
      font-weight: bold;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
      letter-spacing: 0.3px;
    `;
    deleteBtn.onmouseover = () => {
      deleteBtn.style.background = 'rgba(255, 77, 77, 0.3)';
      deleteBtn.style.borderColor = 'rgba(255, 77, 77, 0.5)';
    };
    deleteBtn.onmouseout = () => {
      deleteBtn.style.background = 'rgba(255, 77, 77, 0.15)';
      deleteBtn.style.borderColor = 'rgba(255, 77, 77, 0.3)';
    };
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Hentikan aktivitas ini dan hapus tugas?')) {
        onDelete();
      }
    };
    panel.appendChild(deleteBtn);
  }

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
      <div style="font-weight: bold; color: #00ff00; padding: 5px 0;">Selesai</div>
      <div style="font-size: 0.6rem;">Seluruh tugas telah diproses ✓</div>
    `;
    setTimeout(() => {
      const p = document.getElementById(STATUS_PANEL_ID);
      if (p) p.remove();
    }, delay);
  } else {
    panel.remove();
  }
}
