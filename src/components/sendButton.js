export function sendButton() {
  const btn = document.createElement('button');
  btn.id = 'dandelion-send-btn';
  btn.innerHTML = '✉️ kirim';
  btn.title = 'Kirim form';

  const baseStyle = `
    padding: 0.3rem 0.75rem;
    background: rgba(37, 99, 235, 0.2);
    color: #1e40af;
    border: 1px solid rgba(37, 99, 235, 0.4);
    border-radius: 8px;
    font-size: 0.875rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  `;

  btn.style.cssText = baseStyle;

  btn.addEventListener('mousedown', () => {
    btn.style.transform = 'scale(0.95)';
  });

  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'scale(1)';
  });

  return btn;
}
