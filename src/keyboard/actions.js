let keymap = {};

let badgeStylesInjected = false;

const MAPPING_ORDER = [
  'dandelion-auto-fill',
  'dandelion-debug-toggle',
  'dandelion-zen-mode-toggle',
  'dandelion-zen-skip',
];

function injectBadgeStyles() {
  if (badgeStylesInjected) return;

  const style = document.createElement('style');
  style.textContent = `
    .dandelion-kb-wrapper {
      position: relative;
      display: inline-block;
    }
    .dandelion-kb-badge {
      position: absolute;
      top: -8px;
      left: -4px;
      background: rgba(253, 255, 153, 0.95);
      color: #171717;
      padding: 0 4px;
      font-size: 10px;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-weight: 600;
      line-height: 1.4;
      border-radius: 3px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      pointer-events: none;
      z-index: 1;
    }
  `;
  document.head.appendChild(style);
  badgeStylesInjected = true;
}

function addBadge(buttonId, label) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'dandelion-kb-wrapper';

  btn.parentNode.insertBefore(wrapper, btn);
  wrapper.appendChild(btn);

  const badge = document.createElement('div');
  badge.className = 'dandelion-kb-badge';
  badge.textContent = label;
  wrapper.appendChild(badge);
}

function removeBadges() {
  document.querySelectorAll('.dandelion-kb-wrapper').forEach((wrapper) => {
    const btn = wrapper.querySelector('button');
    if (btn) wrapper.parentNode.insertBefore(btn, wrapper);
    wrapper.remove();
  });
}

export function buildKeymap(configKeymaps) {
  keymap = {};
  for (const [id, key] of Object.entries(configKeymaps || {})) {
    keymap[key] = { id, label: key };
  }
}

export function showKeyHints() {
  injectBadgeStyles();
  for (const [, mapping] of Object.entries(keymap)) {
    if (document.getElementById(mapping.id)) {
      addBadge(mapping.id, mapping.label);
    }
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

export { MAPPING_ORDER };
