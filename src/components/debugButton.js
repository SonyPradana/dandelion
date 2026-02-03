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
      top: 4.5rem;
      right: 0.75rem;
      z-index: 9998;
      padding: 0.3rem 0.75rem;
      background: rgba(255, 255, 255, 0.8);
      color: #171717;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: all 0.2s ease-in-out;
    `;

  debugToggle.addEventListener('mousedown', () => {
    debugToggle.style.transform = 'scale(0.95)';
  });

  debugToggle.addEventListener('mouseup', () => {
    debugToggle.style.transform = 'scale(1)';
  });

  return debugToggle;
}
