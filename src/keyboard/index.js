import { activate, deactivate, isActive } from './mode.js';
import { showKeyHints, hideKeyHints, buildKeymap, buildProfileKeymap } from './actions.js';
import { register, unregister } from './listener.js';
import { getFullConfig } from '../configuration.js';
import browser from 'webextension-polyfill';

export async function init() {
  const config = await getFullConfig();
  buildKeymap(config.keymaps);
  buildProfileKeymap(Object.keys(config.profiles || {}).length);

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.keymaps) {
      buildKeymap(changes.keymaps.newValue);
    }
    if (changes.profiles) {
      buildProfileKeymap(Object.keys(changes.profiles.newValue || {}).length);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (
      event.altKey &&
      event.shiftKey &&
      event.key.toLowerCase() === 'q' &&
      !isActive()
    ) {
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
    }
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
