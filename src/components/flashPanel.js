import { createBasePanel, createPanelButton } from './notification/base';
import { notify } from './notification';
import { setFlashData, clearFlashData } from '../utils/flashSession';
import { addKvRow, rebuildKvRows, S } from './flashKvRow';

const PANEL_ID = 'dandelion-flash-data';

export function showFlashDataPanel({ setData, clearData, onSave, normalizeKey, validate } = {}) {
  const _setData = setData || setFlashData;
  const _clearData = clearData || clearFlashData;
  const existing = document.getElementById(PANEL_ID);
  if (existing) existing.remove();

  _clearData();

  const { panel, contentArea, setHeader, remove } = createBasePanel(PANEL_ID);

  // mobile-friendly: full width with a max cap
  panel.style.cssText += 'width:min(380px,100vw - 16px);';

  contentArea.append(setHeader('Flash Data', '#a78bfa'));

  // ─── shared state ─────────────────────────────────────────────
  let sharedData = {};
  let currentTab = 'json';

  function syncFromJson() {
    try {
      const parsed = JSON.parse(jsonTextarea.value || '{}');
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        sharedData = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string' || typeof v === 'number') {
            sharedData[k] = String(v);
          }
        }
      }
    } catch {}
  }

  function syncFromKv() {
    sharedData = {};
    kvItemsDiv.querySelectorAll('div').forEach((row) => {
      const k = row.querySelector('.flash-kv-key')?.value.trim();
      const v = row.querySelector('.flash-kv-val')?.value ?? '';
      if (k) sharedData[k] = v;
    });
  }

  // ─── tab bar ──────────────────────────────────────────────────
  const tabBar = document.createElement('div');
  tabBar.style.cssText = 'display:flex;gap:4px;margin-bottom:6px;width:100%;';

  const tabBtnBase =
    'flex:1;padding:4px 6px;border:1px solid rgba(255,255,255,0.2);border-radius:4px;' +
    'background:rgba(255,255,255,0.1);color:white;font-size:9px;font-weight:bold;cursor:pointer;' +
    'font-family:inherit;text-transform:uppercase;letter-spacing:0.3px;';

  const jsonTabBtn = document.createElement('button');
  jsonTabBtn.textContent = 'Raw JSON';
  jsonTabBtn.style.cssText = tabBtnBase;

  const kvTabBtn = document.createElement('button');
  kvTabBtn.textContent = 'Tabel KV';
  kvTabBtn.style.cssText = tabBtnBase;

  tabBar.append(jsonTabBtn, kvTabBtn);
  contentArea.appendChild(tabBar);

  // ─── json tab ─────────────────────────────────────────────────
  const jsonContainer = document.createElement('div');
  jsonContainer.style.width = '100%';

  const jsonTextarea = document.createElement('textarea');
  jsonTextarea.style.cssText =
    'width:100%;min-height:80px;padding:6px;border:1px solid rgba(255,255,255,0.15);' +
    'border-radius:4px;background:rgba(0,0,0,0.3);color:white;font-size:10px;' +
    'font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;';
  jsonTextarea.placeholder = '{\n  "LPM...|number": "123",\n  "LPM...|text": "nilai"\n}';
  jsonTextarea.rows = 4;

  jsonContainer.appendChild(jsonTextarea);
  contentArea.appendChild(jsonContainer);

  // ─── kv tab ───────────────────────────────────────────────────
  const kvContainer = document.createElement('div');
  kvContainer.style.cssText = 'display:none;width:100%;';

  const kvItemsDiv = document.createElement('div');
  kvItemsDiv.style.width = '100%';
  kvContainer.appendChild(kvItemsDiv);

  // add new row bar
  const kvAddRow = document.createElement('div');
  kvAddRow.style.cssText = S.row + 'margin-top:4px;margin-bottom:0;';

  const addKeyInput = document.createElement('input');
  addKeyInput.type = 'text';
  addKeyInput.style.cssText = S.input(2);
  addKeyInput.placeholder = 'data-name baru...';

  const addValInput = document.createElement('input');
  addValInput.type = 'text';
  addValInput.style.cssText = S.input(1);
  addValInput.placeholder = 'nilai...';

  const addBtn = document.createElement('button');
  addBtn.textContent = '+';
  addBtn.type = 'button';
  addBtn.style.cssText =
    'flex-shrink:0;padding:2px 8px;border:1px solid rgba(34,197,94,0.3);border-radius:4px;' +
    'background:rgba(34,197,94,0.15);color:#4ade80;font-size:12px;cursor:pointer;' +
    'font-family:inherit;line-height:1;';

  const doAddRow = () => {
    const k = addKeyInput.value.trim();
    const v = addValInput.value;
    if (k) {
      addKvRow(kvItemsDiv, k, v, syncFromKv);
      syncFromKv();
      addKeyInput.value = '';
      addValInput.value = '';
      addKeyInput.focus();
    }
  };

  addBtn.onclick = doAddRow;
  addKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doAddRow();
    }
  });
  addValInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doAddRow();
    }
  });

  kvAddRow.append(addKeyInput, addValInput, addBtn);
  kvContainer.appendChild(kvAddRow);
  contentArea.appendChild(kvContainer);

  // ─── tab switching ────────────────────────────────────────────
  function activateTab(tab) {
    if (currentTab === 'json') syncFromJson();
    if (currentTab === 'kv') syncFromKv();
    currentTab = tab;

    if (tab === 'json') {
      jsonTextarea.value = JSON.stringify(sharedData, null, 2);
    } else {
      rebuildKvRows(kvItemsDiv, sharedData, syncFromKv);
    }

    jsonTabBtn.style.opacity = tab === 'json' ? '1' : '0.4';
    kvTabBtn.style.opacity = tab === 'kv' ? '1' : '0.4';
    jsonContainer.style.display = tab === 'json' ? 'block' : 'none';
    kvContainer.style.display = tab === 'kv' ? 'block' : 'none';
  }

  jsonTabBtn.onclick = () => activateTab('json');
  kvTabBtn.onclick = () => activateTab('kv');
  activateTab('json');

  // ─── action buttons ───────────────────────────────────────────
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex;gap:5px;margin-top:6px;width:100%;';

  const useBtn = createPanelButton('Gunakan', 'success');
  useBtn.style.flex = '1';
  useBtn.onclick = () => {
    if (currentTab === 'json') syncFromJson();
    else syncFromKv();

    if (Object.keys(sharedData).length === 0) {
      notify.info('Flash Data', 'Tidak ada data', 2000);
      return;
    }

    let data = sharedData;
    if (normalizeKey) {
      const normalized = {};
      for (const [k, v] of Object.entries(data)) {
        normalized[normalizeKey(k)] = v;
      }
      data = normalized;
    }

    if (validate) {
      const errors = validate(data);
      if (errors.length > 0) {
        notify.info(
          'Register Form',
          '<ul style="margin:0;padding-left:16px;list-style:disc;line-height:1.6">' +
            errors.map((e) => '<li><b>' + e.key + '</b>: ' + e.message + '</li>').join('') +
            '</ul>',
          3000,
        );
      }
    }

    _clearData();
    _setData({ pinneds: { ...data } });
    notify.info('Flash Data', 'Tersimpan', 1500);
    if (onSave) onSave(data);
  };

  btnContainer.appendChild(useBtn);
  contentArea.appendChild(btnContainer);

  const closeBtn = panel.querySelector('div');
  if (closeBtn && closeBtn.textContent === '\u00D7') {
    closeBtn.onclick = () => remove();
  }
}
