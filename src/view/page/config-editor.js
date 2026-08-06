import browser from '@bridge/browser';
import { store } from '../../store.js';

const editor = document.getElementById('ce-editor');
const statsEl = document.getElementById('ce-stats');
const toastEl = document.getElementById('ce-toast');
const saveBtn = document.getElementById('ce-save-btn');
const resetBtn = document.getElementById('ce-reset-btn');
const closeBtn = document.getElementById('ce-close-btn');

let savedText = '';
let toastTimer = null;

function formatBytes(bytes) {
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function updateStats() {
  const text = editor.value;
  const chars = text.length;
  const bytes = new Blob([text]).size;
  statsEl.textContent = `${chars.toLocaleString('id-ID')} char · ${formatBytes(bytes)}`;
}

function showToast(text, type) {
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = text;
  toastEl.className = `ce-toast ${type} show`;
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}

function setInvalid(invalid) {
  editor.classList.toggle('invalid', invalid);
}

function insertText(text) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  editor.value = editor.value.slice(0, start) + text + editor.value.slice(end);
  editor.selectionStart = start + text.length;
  editor.focus();
  editor.dispatchEvent(new Event('input'));
}

async function loadConfig() {
  store.init(browser);
  const config = await store.getFullConfig();
  savedText = JSON.stringify(config, null, 2);
  editor.value = savedText;
  updateStats();
}

async function handleSave() {
  const text = editor.value;
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    setInvalid(true);
    showToast(`JSON tidak valid: ${error.message}`, 'error');
    return;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    setInvalid(true);
    showToast('Struktur konfigurasi tidak valid. Harus berupa objek JSON.', 'error');
    return;
  }

  if (!parsed.profiles || !parsed.activeProfile) {
    setInvalid(true);
    showToast('Struktur konfigurasi tidak valid. Pastikan ada "profiles" dan "activeProfile".', 'error');
    return;
  }

  try {
    await store.setConfig(parsed);
  } catch (error) {
    setInvalid(true);
    showToast(`Gagal menyimpan: ${error.message}`, 'error');
    return;
  }

  savedText = text;
  setInvalid(false);
  showToast('Tersimpan! ✓', 'success');
}

function handleReset() {
  editor.value = savedText;
  setInvalid(false);
  updateStats();
  showToast('Perubahan dibatalkan', 'success');
  editor.focus();
}

saveBtn.addEventListener('click', handleSave);
resetBtn.addEventListener('click', handleReset);
closeBtn.addEventListener('click', () => {
  window.location.href = './index.html#lainnya';
});

editor.addEventListener('input', () => {
  setInvalid(false);
  updateStats();
});

editor.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    insertText('  ');
  } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    handleSave();
  }
});

loadConfig();
