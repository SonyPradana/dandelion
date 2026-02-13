import { createExcludeToggle } from './ExcludeToggle.js';

const DEBUG_MARKER_CLASS = 'dandelion-debug-marker';

let stylesInitialized = false;

function initializeStyles () {
  if (stylesInitialized) return;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .${DEBUG_MARKER_CLASS} {
      position: absolute;
      top: -0.75rem;
      left: 0;
      background-color: rgba(253, 255, 153, 0.95);
      color: #171717;
      padding: 0.125rem 0.3125rem;
      font-size: 0.6875rem;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-weight: 500;
      line-height: 1.2;
      border: 1px solid rgba(0, 0, 0, 0.1);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .${DEBUG_MARKER_CLASS}:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `;
  document.head.appendChild(styleSheet);
  stylesInitialized = true;
}

/**
 * Creates a debug marker element with specific styling, including an exclude toggle.
 * @param {string} identifier - The text to display inside the marker and the data-name for the exclude toggle.
 * @returns {HTMLDivElement} The created marker element.
 */
export function debugMarker (identifier) {
  initializeStyles();

  const marker = document.createElement('div');
  marker.className = DEBUG_MARKER_CLASS;
  marker.textContent = identifier;

  const excludeToggle = createExcludeToggle(identifier);
  marker.appendChild(excludeToggle);

  return marker;
}
