/**
 * Creates the debug toggle button.
 * @returns {HTMLButtonElement}
 */
export function debugButton () {
  const debugToggle = document.createElement('button');
  debugToggle.id = 'dandelion-debug-toggle';
  debugToggle.innerHTML = '🐞';
  debugToggle.style.cssText = `
      position: fixed;
      top: 64px; /* Positioned below the monkey button */
      right: 10px;
      z-index: 9998;
      padding: 5px 10px; /* Smaller padding */
      background: rgb(243 243 243 / 80%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 14px; /* Smaller font */
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: transform 0.2s ease;
    `;

  debugToggle.addEventListener('mousedown', () => {
    debugToggle.style.transform = 'scale(0.95)';
  });

  debugToggle.addEventListener('mouseup', () => {
    debugToggle.style.transform = 'scale(1)';
  });

  return debugToggle;
}
