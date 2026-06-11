/**
 * Creates a button element with specific styling and interaction effects if it doesn't already exist
 * @param {string} id - The ID to be assigned to the button element
 * @returns {HTMLButtonElement|undefined}
 */
export function button(id) {
  if (document.querySelector(`#${id}`)) {
    return;
  }

  const styleId = 'dandelion-component-states';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .dandelion-running {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
        filter: grayscale(1) !important;
        pointer-events: none !important;
      }
      .dandelion-dimmed {
        opacity: 0.3 !important;
        cursor: not-allowed !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  const tombol = document.createElement('button');
  tombol.id = id;
  tombol.innerHTML = '🙈';
  tombol.style.cssText = `
      padding: 0.75rem 1.25rem;
      background: rgb(253, 255, 153);
      color: #171717;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease-in-out;
      pointer-events: auto;
    `;

  /**
   * Updates the button running state.
   * @param {boolean} isRunning
   */
  tombol.setRunning = (isRunning) => {
    if (isRunning) {
      tombol.classList.add('dandelion-running');
    } else {
      tombol.classList.remove('dandelion-running');
    }
  };

  /**
   * Dimmed state when other automation is running.
   * @param {boolean} isDimmed
   */
  tombol.setDimmed = (isDimmed) => {
    if (isDimmed) {
      tombol.classList.add('dandelion-dimmed');
    } else {
      tombol.classList.remove('dandelion-dimmed');
    }
  };

  tombol.reset = () => {
    tombol.classList.remove('dandelion-running', 'dandelion-dimmed');
  };

  tombol.addEventListener('mousedown', () => {
    if (
      tombol.classList.contains('dandelion-running') ||
      tombol.classList.contains('dandelion-dimmed')
    )
      return;
    tombol.style.transform = 'scale(0.95)';
  });

  tombol.addEventListener('mouseup', () => {
    tombol.style.transform = 'scale(1)';
  });

  return tombol;
}
