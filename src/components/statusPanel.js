import { h } from '../utils/dom';
import { notify } from './notification';
import { createBasePanel, createPanelButton } from './notification/base';

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
  const { title, onDelete } = options;
  const { panel, contentArea, setHeader } = createBasePanel(STATUS_PANEL_ID);

  // Always enable pointer events if onDelete is provided, otherwise disable
  panel.style.pointerEvents = onDelete ? 'auto' : 'none';

  let statusText = status;
  if (typeof status === 'boolean') {
    statusText = status ? '⏳ Sedang diproses...' : '✅ Selesai';
  }

  const titleText = title || 'Status Tugas';
  const titleColor = onDelete ? '#ff4d4d' : '#ffd700';

  const progressDiv = document.createElement('div');
  progressDiv.style.cssText =
    'display: flex; justify-content: space-between; gap: 15px; align-items: center;';
  const span1 = document.createElement('span');
  span1.style.cssText = 'opacity: 0.8;';
  span1.textContent = 'Progres';
  const span2 = document.createElement('span');
  span2.style.cssText = 'font-weight: bold; font-size: 12px;';
  span2.textContent = `${done}/${total}`;
  progressDiv.append(span1, span2);

  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'font-size: 0.6rem; opacity: 0.7; font-style: italic;';
  statusDiv.textContent = statusText;

  contentArea.append(setHeader(titleText, titleColor), progressDiv, statusDiv);

  if (onDelete) {
    // Check if button already exists in contentArea
    if (!contentArea.querySelector('.dandelion-delete-btn')) {
      const deleteBtn = createPanelButton('HENTIKAN & HAPUS', 'danger');
      deleteBtn.classList.add('dandelion-delete-btn');
      deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (await notify.confirm('Hentikan Tugas', 'Hentikan aktivitas ini dan hapus tugas?')) {
          onDelete();
        }
      };
      contentArea.appendChild(deleteBtn);
    }
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
    panel.replaceChildren(
      h('div', { style: 'font-weight: bold; color: #00ff00; padding: 5px 0;' }, 'Selesai'),
      h('div', { style: 'font-size: 0.6rem;' }, 'Seluruh tugas telah diproses \u2713'),
    );
    setTimeout(() => {
      const p = document.getElementById(STATUS_PANEL_ID);
      if (p) p.remove();
    }, delay);
  } else {
    panel.remove();
  }
}
