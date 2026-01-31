import { isExcluded, toggleExclude } from '../utils/excludes.js';

/**
 * Creates a debug marker element with specific styling, including an exclude toggle.
 * @param {string} identifier - The text to display inside the marker and the data-name for the exclude toggle.
 * @returns {HTMLDivElement} The created marker element.
 */
export function debugMarker (identifier) {
  const DEBUG_MARKER_CLASS = 'dandelion-debug-marker';
  const marker = document.createElement('div');

  marker.textContent = identifier;
  marker.className = DEBUG_MARKER_CLASS;
  marker.style.cssText = `
    position: absolute;
    top: -10px;
    left: 0;
    background-color: rgb(253 255 153);
    color: #161616;
    padding: 2px 5px;
    font-size: 10px;
    font-family: monospace;
    border: none;
    z-index: 10000;
    white-space: nowrap;
    display: flex;
    align-items: center;
  `;

  const excludeToggler = document.createElement('span');
  excludeToggler.style.cursor = 'pointer';
  excludeToggler.style.fontWeight = 'bold';
  excludeToggler.style.backgroundColor = 'transparent';
  excludeToggler.style.color = 'lightgray';
  excludeToggler.style.padding = '0 4px';
  excludeToggler.style.borderRadius = '3px';
  excludeToggler.style.marginLeft = '5px';
  excludeToggler.style.flexShrink = '0';

  isExcluded(identifier).then(excluded => {
    excludeToggler.textContent = excluded ? '❌' : '➕';
    // excludeToggler.title = excluded ? 'Click to include this question' : 'Click to exclude this question'; // Removed tooltip
  });

  excludeToggler.addEventListener('click', async (e) => {
    e.stopPropagation();
    const nowExcluded = await toggleExclude(identifier);
    excludeToggler.textContent = nowExcluded ? '❌' : '➕';
    // excludeToggler.title = nowExcluded ? 'Click to include this question' : 'Click to exclude this question'; // Removed tooltip
  });

  marker.appendChild(excludeToggler);

  return marker;
}
