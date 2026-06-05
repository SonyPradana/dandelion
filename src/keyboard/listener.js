import { getKeymap, triggerById } from './actions.js';

let handler = null;
let onDeactivate = null;

function isEditableElement(element) {
  if (!element) return false;

  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable
  );
}

export function register(cleanupFn) {
  if (handler) return;

  onDeactivate = cleanupFn;
  const keymap = getKeymap();

  handler = (event) => {
    if (isEditableElement(event.target)) return;

    const key = event.key.toLowerCase();

    if (key === 'escape') {
      event.preventDefault();
      onDeactivate?.();
      return;
    }

    const mapping = keymap[key];
    if (mapping && triggerById(mapping.id)) {
      event.preventDefault();
      event.stopPropagation();
      onDeactivate?.();
    }
  };

  document.addEventListener('keydown', handler, true);
}

export function unregister() {
  if (!handler) return;
  document.removeEventListener('keydown', handler, true);
  handler = null;
  onDeactivate = null;
}
