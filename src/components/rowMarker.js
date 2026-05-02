import { createNotCheckedToggle } from './notCheckedToggle';

const ROW_MARKER_CLASS = 'dandelion-row-marker';
let stylesInitialized = false;

function initializeStyles() {
  if (stylesInitialized) return;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .${ROW_MARKER_CLASS} {
      position: absolute;
      top: -0.8rem;
      left: 3rem;
      z-index: 1000;
      background-color: rgba(253, 255, 153, 0.95);
      color: #171717;
      padding: 2px 8px;
      font-size: 0.6875rem;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-weight: bold;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      white-space: nowrap;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: opacity 0.2s ease;
    }
  `;
  document.head.appendChild(styleSheet);
  stylesInitialized = true;
}

/**
 * Creates a stylized marker for a row header.
 * @param {string} rowId - The ID of the row.
 * @param {Object} [config] - Optional configuration object to initialize toggle state.
 * @returns {HTMLDivElement}
 */
export function createRowMarker(rowId, config) {
  initializeStyles();

  const marker = document.createElement('div');
  marker.className = ROW_MARKER_CLASS;
  marker.dataset.rowId = rowId;

  const idText = document.createElement('span');
  idText.textContent = rowId;
  idText.style.marginRight = '2px';

  let initialIsActive = undefined;
  if (config) {
    const listString = config.notCheckedList || '';
    const list = listString.split(';').filter(Boolean);
    initialIsActive = list.includes(rowId);
  }

  const toggle = createNotCheckedToggle(rowId, config, initialIsActive);

  marker.appendChild(idText);
  marker.appendChild(toggle);

  return marker;
}
