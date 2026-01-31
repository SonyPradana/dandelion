/**
 * Creates a debug marker element with specific styling.
 * @param {string} textContent - The text to display inside the marker.
 * @returns {HTMLDivElement} The created marker element.
 */
export function debugMarker (textContent) {
  const DEBUG_MARKER_CLASS = 'dandelion-debug-marker';
  const marker = document.createElement('div');

  marker.textContent = textContent;
  marker.className = DEBUG_MARKER_CLASS;
  marker.style.cssText = `
    position: absolute;
    top: -10px;
    left: 0;
    background-color: yellow;
    color: black;
    padding: 2px 5px;
    font-size: 10px;
    font-family: monospace;
    border: 1px solid black;
    z-index: 10000;
    white-space: nowrap;
  `;

  return marker;
}
