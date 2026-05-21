import { html } from 'htm/preact';
import { useState } from 'preact/hooks';

function getDisplayName(profiles, key) {
  const p = profiles[key];
  if (p && p.name) return p.name;
  if (key === 'profile1') return 'Profile 1';
  if (key === 'profile2') return 'Profile 2';
  return key;
}

export function ProfileManager({ profiles = {}, activeProfile, onSwitch, onChange }) {
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [addVal, setAddVal] = useState('');

  const keys = Object.keys(profiles);

  const handleRenameStart = (key) => {
    setRenaming(key);
    setRenameVal(getDisplayName(profiles, key));
  };

  const handleRenameFinish = () => {
    if (renaming && renameVal.trim() && renameVal.trim() !== getDisplayName(profiles, renaming)) {
      profiles[renaming].name = renameVal.trim();
      if (onChange) onChange();
    }
    setRenaming(null);
  };

  const addProfile = () => {
    const name = addVal.trim();
    if (!name || keys.length >= 5) return;
    let i = 1;
    while (profiles[`profile${i}`]) i++;
    const key = `profile${i}`;
    profiles[key] = {
      name,
      formSkrining: { url: '', scrollToButton: true, radioButtonKeywords: '', dropdownKeywords: '', excludes: '', pinneds: {} },
      notChecked: { url: '', notCheckedList: '', automationDelay: 2000, itemDelay: 1000, reloadDelay: 1000, domTimeout: 5000 },
      skrining: { url: '' },
      zenMode: { domTimeout: 5000 },
    };
    setAddVal('');
    if (onChange) onChange();
  };

  const removeProfile = (key) => {
    if (keys.length <= 1) return;
    const wasActive = key === activeProfile;
    delete profiles[key];
    if (wasActive && onSwitch) onSwitch(Object.keys(profiles)[0]);
    if (onChange) onChange();
  };

  const duplicateProfile = (key) => {
    if (keys.length >= 5) return;
    let i = 1;
    while (profiles[`profile${i}`]) i++;
    const newKey = `profile${i}`;
    const source = profiles[key];
    const clone = structuredClone(source);
    let newName = `${source.name} (copy)`;
    let counter = 2;
    while (Object.values(profiles).some((p) => p.name === newName)) {
      newName = `${source.name} (copy ${counter})`;
      counter++;
    }
    clone.name = newName;
    profiles[newKey] = clone;
    if (onChange) onChange();
  };

  return html`
    <div class="pm-card-list">
      ${keys.map((key) => html`
        <div class="pm-card${key === activeProfile ? ' active' : ''}" data-profile=${key}
          onClick=${(e) => {
            if (e.target.closest('.pm-btn-edit') || e.target.closest('.pm-btn-duplicate') || e.target.closest('.pm-btn-delete')) return;
            if (onSwitch) onSwitch(key);
          }}>
          <span class="pm-indicator">●</span>
          ${renaming === key ? html`
            <input type="text" class="pm-rename-input" value=${renameVal} maxLength="30" autoFocus
              onInput=${(e) => setRenameVal(e.target.value)}
              onBlur=${handleRenameFinish}
              onKeyPress=${(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRenameFinish(); } }}
              onKeyDown=${(e) => { if (e.key === 'Escape') { e.preventDefault(); setRenaming(null); } }} />
          ` : html`
            <span class="pm-name">${getDisplayName(profiles, key)}</span>
          `}
          <button class="pm-btn-edit" title="Ubah nama" onClick=${(e) => { e.stopPropagation(); handleRenameStart(key); }}>✏️</button>
          <button class="pm-btn-duplicate" title="Duplikat profile" onClick=${(e) => { e.stopPropagation(); duplicateProfile(key); }}>📋</button>
          <button class="pm-btn-delete" title="Hapus profile" onClick=${(e) => {
            e.stopPropagation();
            if (confirm(`Hapus profile "${getDisplayName(profiles, key)}"?`)) removeProfile(key);
          }}>🗑️</button>
        </div>
      `)}
    </div>
    ${keys.length < 5 ? html`
      <div class="pm-add-row">
        <input type="text" class="pm-add-input" placeholder="Nama profile baru..." maxLength="30" value=${addVal}
          onInput=${(e) => setAddVal(e.target.value)}
          onKeyPress=${(e) => { if (e.key === 'Enter') { e.preventDefault(); addProfile(); } }} />
        <button class="pm-btn-add" title="Tambah profile" onClick=${addProfile}>+</button>
      </div>
    ` : ''}
  `;
}
