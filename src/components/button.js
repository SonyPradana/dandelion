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
      padding: 10px 20px;
      background: #FDFF99;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      transition: transform 0.2s ease;
    `;

  tombol.addEventListener('mousedown', () => {
    tombol.style.transform = 'scale(0.95)';
  });

  tombol.addEventListener('mouseup', () => {
    tombol.style.transform = 'scale(1)';
  });

  return tombol;
}
