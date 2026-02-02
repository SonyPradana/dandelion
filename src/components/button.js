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
      top: 10px;
      right: 10px;
      z-index: 9999;
      padding: 0.75rem 1rem;
      background: rgb(255, 223, 0); /* Dandelion yellow */
      color: #333; /* Dark text for contrast */
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
