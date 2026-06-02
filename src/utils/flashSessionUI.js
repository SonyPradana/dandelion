import { createBasePanel, createPanelButton } from '../components/notification/base';

/**
 * Menampilkan panel opsional untuk set flash data (pinneds).
 * User bisa skip (return null) atau set data (return { pinneds: {...} }).
 * @returns {Promise<{pinneds: Object.<string, string>}|null>}
 */
export function showFlashDataPanel() {
  return new Promise((resolve) => {
    const id = `dandelion-flash-data-${Date.now()}`;
    const { panel, contentArea, setHeader, remove } = createBasePanel(id);

    panel.style.maxWidth = '320px';
    panel.style.width = '320px';

    contentArea.innerHTML = setHeader('Flash Data (Opsional)', '#a78bfa');

    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:4px;margin-bottom:6px;';

    const jsonTabBtn = document.createElement('button');
    jsonTabBtn.textContent = 'Raw JSON';
    jsonTabBtn.style.cssText =
      'flex:1;padding:4px 6px;border:1px solid rgba(255,255,255,0.2);border-radius:4px;' +
      'background:rgba(255,255,255,0.1);color:white;font-size:9px;font-weight:bold;cursor:pointer;' +
      'font-family:inherit;text-transform:uppercase;letter-spacing:0.3px;';

    const kvTabBtn = document.createElement('button');
    kvTabBtn.textContent = 'Tabel KV';
    kvTabBtn.style.cssText =
      'flex:1;padding:4px 6px;border:1px solid rgba(255,255,255,0.2);border-radius:4px;' +
      'background:rgba(255,255,255,0.1);color:white;font-size:9px;font-weight:bold;cursor:pointer;' +
      'font-family:inherit;text-transform:uppercase;letter-spacing:0.3px;';

    tabBar.append(jsonTabBtn, kvTabBtn);
    contentArea.appendChild(tabBar);

    const jsonContainer = document.createElement('div');
    const jsonTextarea = document.createElement('textarea');
    jsonTextarea.style.cssText =
      'width:100%;min-height:80px;padding:6px;border:1px solid rgba(255,255,255,0.15);' +
      'border-radius:4px;background:rgba(0,0,0,0.3);color:white;font-size:10px;' +
      'font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;';
    jsonTextarea.placeholder = '{\n  "LPM...|number": "123",\n  "LPM...|text": "nilai"\n}';
    jsonTextarea.rows = 4;
    jsonContainer.appendChild(jsonTextarea);
    contentArea.appendChild(jsonContainer);

    const kvContainer = document.createElement('div');
    kvContainer.style.display = 'none';

    const kvItemsDiv = document.createElement('div');

    function addKvRow(key, value) {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;gap:4px;margin-bottom:4px;align-items:center;';

      const keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.className = 'flash-kv-key';
      keyInput.value = key;
      keyInput.style.cssText =
        'flex:1;padding:4px 6px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;' +
        'background:rgba(0,0,0,0.3);color:white;font-size:10px;font-family:inherit;outline:none;';
      keyInput.placeholder = 'data-name...';

      const valInput = document.createElement('input');
      valInput.type = 'text';
      valInput.className = 'flash-kv-val';
      valInput.value = String(value);
      valInput.style.cssText =
        'flex:1;padding:4px 6px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;' +
        'background:rgba(0,0,0,0.3);color:white;font-size:10px;font-family:inherit;outline:none;';
      valInput.placeholder = 'nilai...';

      const rmBtn = document.createElement('button');
      rmBtn.textContent = '×';
      rmBtn.type = 'button';
      rmBtn.style.cssText =
        'padding:2px 6px;border:1px solid rgba(255,77,77,0.3);border-radius:4px;' +
        'background:rgba(255,77,77,0.15);color:#ff4d4d;font-size:12px;cursor:pointer;' +
        'font-family:inherit;line-height:1;';
      rmBtn.onclick = () => row.remove();

      row.append(keyInput, valInput, rmBtn);
      kvItemsDiv.appendChild(row);
    }

    kvContainer.appendChild(kvItemsDiv);

    const kvAddRow = document.createElement('div');
    kvAddRow.style.cssText = 'display:flex;gap:4px;margin-top:4px;';

    const addKeyInput = document.createElement('input');
    addKeyInput.type = 'text';
    addKeyInput.style.cssText =
      'flex:1;padding:4px 6px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;' +
      'background:rgba(0,0,0,0.3);color:white;font-size:10px;font-family:inherit;outline:none;';
    addKeyInput.placeholder = 'data-name baru...';

    const addValInput = document.createElement('input');
    addValInput.type = 'text';
    addValInput.style.cssText =
      'flex:1;padding:4px 6px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;' +
      'background:rgba(0,0,0,0.3);color:white;font-size:10px;font-family:inherit;outline:none;';
    addValInput.placeholder = 'nilai...';

    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.type = 'button';
    addBtn.style.cssText =
      'padding:2px 8px;border:1px solid rgba(34,197,94,0.3);border-radius:4px;' +
      'background:rgba(34,197,94,0.15);color:#4ade80;font-size:12px;cursor:pointer;' +
      'font-family:inherit;line-height:1;';
    addBtn.onclick = () => {
      const k = addKeyInput.value.trim();
      const v = addValInput.value;
      if (k) {
        addKvRow(k, v);
        addKeyInput.value = '';
        addValInput.value = '';
        addKeyInput.focus();
      }
    };
    addKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        addBtn.click();
      }
    });

    kvAddRow.append(addKeyInput, addValInput, addBtn);
    kvContainer.appendChild(kvAddRow);
    contentArea.appendChild(kvContainer);

    function activateTab(tab) {
      const dim = '0.4';
      const bright = '1';
      jsonTabBtn.style.opacity = tab === 'json' ? bright : dim;
      kvTabBtn.style.opacity = tab === 'kv' ? bright : dim;
      jsonContainer.style.display = tab === 'json' ? 'block' : 'none';
      kvContainer.style.display = tab === 'kv' ? 'block' : 'none';
    }

    jsonTabBtn.onclick = () => activateTab('json');
    kvTabBtn.onclick = () => activateTab('kv');
    activateTab('json');

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:5px;margin-top:6px;';

    const skipBtn = createPanelButton('Skip', 'default');
    skipBtn.onclick = () => {
      remove();
      resolve(null);
    };

    const useBtn = createPanelButton('Gunakan', 'success');
    useBtn.onclick = () => {
      let pinneds = {};

      if (jsonContainer.style.display !== 'none') {
        try {
          const parsed = JSON.parse(jsonTextarea.value);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Harus object');
          }
          for (const k of Object.keys(parsed)) {
            const v = parsed[k];
            if (typeof v === 'string' || typeof v === 'number') {
              pinneds[k] = String(v);
            }
          }
        } catch {
          return;
        }
      } else {
        const rows = kvItemsDiv.querySelectorAll('div');
        rows.forEach((row) => {
          const keyInput = row.querySelector('.flash-kv-key');
          const valInput = row.querySelector('.flash-kv-val');
          if (keyInput && valInput) {
            const k = keyInput.value.trim();
            if (k) {
              pinneds[k] = valInput.value;
            }
          }
        });
      }

      if (Object.keys(pinneds).length === 0) {
        return;
      }

      remove();
      resolve({ pinneds });
    };

    btnContainer.append(skipBtn, useBtn);
    contentArea.appendChild(btnContainer);

    const closeBtn = panel.querySelector('div');
    if (closeBtn && closeBtn.textContent === '×') {
      closeBtn.onclick = () => {
        remove();
        resolve(null);
      };
    }
  });
}
