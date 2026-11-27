/**
 * Creates the small refresh control overlaid on the control panel corner.
 * @returns {HTMLButtonElement}
 */
export function refreshButton() {
  const btn = document.createElement('button');
  btn.id = 'dandelion-refresh-handler';
  btn.type = 'button';
  btn.textContent = '⟳';
  btn.title = 'Refresh Handler';
  btn.setAttribute('aria-label', 'Refresh Handler');
  btn.style.cssText = `
    position: absolute;
    top: -6px;
    right: -6px;
    z-index: 10001;
    width: 18px;
    height: 18px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.8);
    color: #3f3f46;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    font-size: 11px;
    line-height: 1;
    opacity: 0.6;
    cursor: pointer;
    pointer-events: auto;
  `;

  return btn;
}
