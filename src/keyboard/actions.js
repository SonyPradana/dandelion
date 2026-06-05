import { mountBadge, removeBadges } from '../components/keyboardBadge.js';
import { setActiveProfile } from '../configuration.js';

let keymap = {};
let profileKeymap = {};

const MAPPING_ORDER = [
  'dandelion-auto-fill',
  'dandelion-debug-toggle',
  'dandelion-zen-mode-toggle',
  'dandelion-zen-skip',
];

export function buildKeymap(configKeymaps) {
  keymap = {};
  for (const [id, key] of Object.entries(configKeymaps || {})) {
    keymap[key] = { id, label: key };
  }
}

export function buildProfileKeymap(profileCount) {
  profileKeymap = {};
  for (let i = 1; i <= profileCount; i++) {
    profileKeymap[String(i)] = i;
  }
}

export function switchToProfile(index) {
  return setActiveProfile(`profile${index}`);
}

export function showKeyHints() {
  for (const [, mapping] of Object.entries(keymap)) {
    const btn = document.getElementById(mapping.id);
    if (btn) mountBadge(btn, mapping.label);
  }
}

export function hideKeyHints() {
  removeBadges();
}

export function triggerById(buttonId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return false;
  btn.click();
  return true;
}

export function getKeymap() {
  return keymap;
}

export function getProfileKeymap() {
  return profileKeymap;
}

export { MAPPING_ORDER };
