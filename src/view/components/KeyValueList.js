import { html } from 'htm/preact';
import { useState, useCallback } from 'preact/hooks';

export function KeyValueList({ data = {}, onChange }) {
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const notify = useCallback((next) => {
    if (onChange) onChange({ ...next });
  }, [onChange]);

  const addItem = () => {
    const k = newKey.trim();
    if (!k) return;
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      alert('Kunci sudah ada!');
      return;
    }
    const next = { ...data, [k]: newVal || '' };
    notify(next);
    setNewKey('');
    setNewVal('');
  };

  const removeItem = (key) => {
    const next = { ...data };
    delete next[key];
    notify(next);
  };

  const updateValue = (key, val) => {
    const next = { ...data, [key]: val };
    notify(next);
  };

  const keys = Object.keys(data);

  return html`
    <div class="kv-list-wrapper">
      <div class="kv-list-header">
        <div class="kv-header-key">Kunci</div>
        <div class="kv-header-value">Nilai</div>
        <div class="kv-header-action"></div>
      </div>
      <div class="kv-list-items">
        ${keys.length === 0 ? html`
          <div class="kv-empty-state">Belum ada data. Tambahkan key-value baru di bawah.</div>
        ` : keys.map((key) => html`
          <div class="kv-item-row">
            <div class="kv-item-key" data-full-key=${key}
              onClick=${(e) => { if (!window.getSelection().toString()) e.currentTarget.classList.toggle('expanded'); }}>
              ${key}
            </div>
            <div class="kv-item-value">
              <textarea class="kv-textarea" rows="1" value=${data[key] || ''}
                onInput=${(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; updateValue(key, e.target.value); }}>
              </textarea>
            </div>
            <div class="kv-item-action">
              <button class="kv-btn-remove" type="button" title="Hapus item ini" onClick=${() => removeItem(key)}>×</button>
            </div>
          </div>
        `)}
      </div>
      <div class="kv-add-row">
        <div class="kv-add-key">
          <input type="text" class="kv-input-key" placeholder="Masukkan kunci baru..." value=${newKey}
            onInput=${(e) => setNewKey(e.target.value)}
            onKeyDown=${(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addItem(); } }} />
        </div>
        <div class="kv-add-value">
          <textarea class="kv-textarea" rows="1" placeholder="Masukkan nilai..." value=${newVal}
            onInput=${(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; setNewVal(e.target.value); }}>
          </textarea>
        </div>
        <div class="kv-add-action">
          <button class="kv-btn-add" type="button" title="Tambah item baru" onClick=${addItem}>+</button>
        </div>
      </div>
    </div>
  `;
}
