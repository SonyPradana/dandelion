import { html } from 'htm/preact';
import { useState } from 'preact/hooks';

export function Pane({ header, children }) {
  return html`
    <div class="pane-header">${header}</div>
    <div class="pane-body">${children}</div>
  `;
}

export function FormGroup({ label, htmlFor, children }) {
  return html`
    <div class="form-group">
      ${label ? html`<label for=${htmlFor || ''}>${label}</label>` : ''} ${children}
    </div>
  `;
}

export function SaveButton({ onSave, label }) {
  const [saved, setSaved] = useState(false);
  const handle = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return html`
    <button class="btn btn-primary" onClick=${handle}>
      ${saved ? 'Tersimpan!' : label || 'Simpan'}
    </button>
  `;
}

export function FeedbackMsg({ msg }) {
  if (!msg) return null;
  return html`<div class="license-message ${msg.type}">${msg.text}</div>`;
}
