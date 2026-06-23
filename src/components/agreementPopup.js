import { AGREEMENT_SECTIONS_HTML } from '../agreement-text';
import { store } from '../store';
import { h, html, fragment } from '../utils/dom';

const POPUP_ID = 'dandelion-agreement-popup';

export function showAgreementPopup() {
  const existing = document.getElementById(POPUP_ID);
  if (existing) existing.remove();

  const overlay = h('div', {
    id: POPUP_ID,
    style:
      'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);',
  });

  const style = document.createElement('style');
  style.textContent = `
    #${POPUP_ID} {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
    }
    #${POPUP_ID} .dap-card {
      background: #fff;
      border-radius: 16px;
      width: 90%;
      max-width: 560px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    #${POPUP_ID} .dap-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      padding: 1.5rem 2rem;
      text-align: center;
      flex-shrink: 0;
    }
    #${POPUP_ID} .dap-header h1 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }
    #${POPUP_ID} .dap-body {
      padding: 1.5rem 2rem;
      overflow-y: auto;
      flex: 1;
    }
    #${POPUP_ID} .dap-body .highlight {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px 16px;
      margin: 0 0 16px;
      border-radius: 4px;
      font-size: 14px;
      color: #856404;
    }
    #${POPUP_ID} .dap-body .section {
      margin-bottom: 20px;
    }
    #${POPUP_ID} .dap-body .section h2 {
      color: #667eea;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #${POPUP_ID} .dap-body .section h2::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 18px;
      background: #667eea;
      border-radius: 2px;
      flex-shrink: 0;
    }
    #${POPUP_ID} .dap-body .section p {
      color: #555;
      font-size: 14px;
      margin-bottom: 6px;
      line-height: 1.6;
    }
    #${POPUP_ID} .dap-body .section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    #${POPUP_ID} .dap-body .section ul li {
      padding: 3px 0 3px 20px;
      position: relative;
      color: #555;
      font-size: 14px;
    }
    #${POPUP_ID} .dap-body .section ul li::before {
      content: '•';
      position: absolute;
      left: 6px;
      color: #667eea;
      font-weight: bold;
    }
    #${POPUP_ID} .dap-footer {
      padding: 1rem 2rem;
      border-top: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    #${POPUP_ID} .dap-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
    }
    #${POPUP_ID} .dap-checkbox input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      cursor: pointer;
      accent-color: #667eea;
      flex-shrink: 0;
    }
    #${POPUP_ID} .dap-checkbox label {
      font-size: 14px;
      color: #333;
      cursor: pointer;
      user-select: none;
    }
    #${POPUP_ID} .dap-btn {
      width: 100%;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      opacity: 0.4;
      pointer-events: none;
    }
    #${POPUP_ID} .dap-btn.enabled {
      opacity: 1;
      pointer-events: auto;
    }
    #${POPUP_ID} .dap-btn.enabled:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
    }
  `;
  overlay.appendChild(style);

  const card = h(
    'div',
    { className: 'dap-card' },
    html`<div class="dap-header"><h1>SYARAT DAN KETENTUAN PENGGUNAAN</h1></div>`,
    h('div', { className: 'dap-body' }, fragment(AGREEMENT_SECTIONS_HTML)),
    h(
      'div',
      { className: 'dap-footer' },
      h(
        'div',
        { className: 'dap-checkbox' },
        h('input', { type: 'checkbox', id: `${POPUP_ID}-checkbox` }),
        h(
          'label',
          { for: `${POPUP_ID}-checkbox` },
          'Saya telah membaca dan menyetujui syarat dan ketentuan.',
        ),
      ),
      h(
        'button',
        { className: 'dap-btn', id: `${POPUP_ID}-btn`, disabled: '' },
        'Setuju & Lanjutkan',
      ),
    ),
  );
  overlay.appendChild(card);

  document.body.appendChild(overlay);

  const checkbox = overlay.querySelector(`#${POPUP_ID}-checkbox`);
  const btn = overlay.querySelector(`#${POPUP_ID}-btn`);

  checkbox.addEventListener('change', () => {
    const checked = checkbox.checked;
    btn.disabled = !checked;
    btn.classList.toggle('enabled', checked);
  });

  let resolvePromise = null;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  function remove() {
    const el = document.getElementById(POPUP_ID);
    if (el) el.remove();
    if (resolvePromise) resolvePromise();
  }

  btn.addEventListener('click', async () => {
    await store.setAgreement(true);
    remove();
  });

  return { promise, remove };
}
