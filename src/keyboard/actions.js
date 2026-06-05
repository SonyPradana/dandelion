import { mountBadge, removeBadges } from '../components/keyboardBadge.js';
import { setActiveProfile } from '../configuration.js';

let keymap = {};
let profileKeymap = {};

const MAPPING_ORDER = [
  'dandelion-auto-fill',
  'dandelion-not-checked-automation',
  'dandelion-debug-toggle',
  'dandelion-zen-mode-toggle',
  'dandelion-zen-skip',
];

export function buildKeymap(configKeymaps) {
  keymap = {};
  for (const [id, key] of Object.entries(configKeymaps || {})) {
    if (!keymap[key]) keymap[key] = { ids: [], label: key };
    keymap[key].ids.push(id);
  }
}

export function buildProfileKeymap(profileCount) {
  profileKeymap = {};
  for (let i = 1; i <= profileCount; i++) {
    profileKeymap[String(i)] = i;
  }
}

export async function switchToProfile(index) {
  await setActiveProfile(`profile${index}`);
  window.location.reload();
}

export function showKeyHints() {
  for (const [, mapping] of Object.entries(keymap)) {
    for (const id of mapping.ids) {
      const btn = document.getElementById(id);
      if (btn) { mountBadge(btn, mapping.label); break; }
    }
  }
}

export function hideKeyHints() {
  removeBadges();
}

export function triggerById(buttonIds) {
  for (const id of buttonIds) {
    const btn = document.getElementById(id);
    if (btn) { btn.click(); return true; }
  }
  return false;
}

export function getKeymap() {
  return keymap;
}

export function getProfileKeymap() {
  return profileKeymap;
}

export { MAPPING_ORDER };
