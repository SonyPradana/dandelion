import { activate, deactivate, isActive } from './mode.js';
import { showKeyHints, hideKeyHints, buildKeymap, buildProfileKeymap } from './actions.js';
import { register, unregister } from './listener.js';
import { getFullConfig } from '../configuration.js';
import browser from 'webextension-polyfill';

let currentShortcut = null;

export function matchesShortcut(event, s) {
  return (
    event.altKey === !!s.alt &&
    event.shiftKey === !!s.shift &&
    event.ctrlKey === !!s.ctrl &&
    !event.metaKey &&
    event.key.toLowerCase() === s.key
  );
}

export async function init() {
  const config = await getFullConfig();
  currentShortcut = config.shortcut || { key: 'q', alt: true, shift: false, ctrl: false };
  buildKeymap(config.keymaps);
  buildProfileKeymap(Object.keys(config.profiles || {}).length);

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.shortcut) {
      currentShortcut = changes.shortcut.newValue;
    }
    if (changes.keymaps) {
      buildKeymap(changes.keymaps.newValue);
    }
    if (changes.profiles) {
      buildProfileKeymap(Object.keys(changes.profiles.newValue || {}).length);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!currentShortcut || !matchesShortcut(event, currentShortcut) || isActive()) return;

    const target = event.target;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    )
      return;

    event.preventDefault();
    activateMode();
  });
}

function activateMode() {
  activate();
  showKeyHints();
  register(deactivateMode);
}

function deactivateMode() {
  hideKeyHints();
  unregister();
  deactivate();
}
