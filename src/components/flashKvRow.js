export const S = {
  input: (flex) =>
    `flex:${flex};padding:4px 6px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;` +
    `background:rgba(0,0,0,0.3);color:white;font-size:10px;font-family:inherit;outline:none;` +
    `min-width:0;box-sizing:border-box;`,
  row: 'display:flex;gap:4px;margin-bottom:4px;align-items:center;width:100%;',
};

export function addKvRow(container, key, value, onRowChange) {
  const row = document.createElement('div');
  row.style.cssText = S.row;

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.className = 'flash-kv-key';
  keyInput.value = key;
  keyInput.style.cssText = S.input(2);
  keyInput.placeholder = 'data-name...';

  const valInput = document.createElement('input');
  valInput.type = 'text';
  valInput.className = 'flash-kv-val';
  valInput.value = String(value);
  valInput.style.cssText = S.input(1);
  valInput.placeholder = 'nilai...';

  const rmBtn = document.createElement('button');
  rmBtn.textContent = '\u00D7';
  rmBtn.type = 'button';
  rmBtn.style.cssText =
    'flex-shrink:0;padding:2px 6px;border:1px solid rgba(255,77,77,0.3);border-radius:4px;' +
    'background:rgba(255,77,77,0.15);color:#ff4d4d;font-size:12px;cursor:pointer;' +
    'font-family:inherit;line-height:1;';
  rmBtn.onclick = () => {
    row.remove();
    onRowChange();
  };

  keyInput.addEventListener('input', onRowChange);
  valInput.addEventListener('input', onRowChange);

  row.append(keyInput, valInput, rmBtn);
  container.appendChild(row);
}

export function rebuildKvRows(container, data, onRowChange) {
  container.innerHTML = '';
  for (const [key, value] of Object.entries(data)) {
    addKvRow(container, key, String(value), onRowChange);
  }
}
