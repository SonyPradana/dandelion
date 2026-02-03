/**
 * Creates a button element with specific styling and interaction effects if it doesn't already exist
 * @param {string} id - The ID to be assigned to the button element
 * @returns {HTMLButtonElement|undefined}
 */
export function button (id) {
  if (document.querySelector(`#${id}`)) {
    return;
  }

  const tombol = document.createElement('button');
  tombol.id = id;
  tombol.innerHTML = '🙈';
  tombol.style.cssText = `
      position: fixed;
      top: 0.75rem;
      right: 0.75rem;
      z-index: 9999;
      padding: 0.75rem 1.25rem;
      background: rgb(253, 255, 153);
      color: #171717;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease-in-out;
    `;

  tombol.addEventListener('mousedown', () => {
    tombol.style.transform = 'scale(0.95)';
  });

  tombol.addEventListener('mouseup', () => {
    tombol.style.transform = 'scale(1)';
  });

  return tombol;
}
