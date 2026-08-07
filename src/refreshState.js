import { PANEL_ID } from './components/controlPanel.js';
import { PANEL_ID as FLASH_PANEL_ID } from './components/flashPanel.js';
import { ACTION_PANEL_PREFIX } from './components/notification/index.js';
import { DEBUG_MARKER_CLASS } from './components/marker.js';
import { ROW_MARKER_CLASS } from './components/rowMarker.js';

const cleanups = [];
let reinit = null;
let isRefreshing = false;

export function registerCleanup(fn) {
  cleanups.push(fn);
}

export function setReinit(fn) {
  reinit = fn;
}

export function teardown() {
  while (cleanups.length > 0) {
    const fn = cleanups.pop();
    try {
      fn();
    } catch (error) {
      console.error('[Dandelion] cleanup error:', error);
    }
  }

  document.getElementById(PANEL_ID)?.remove();
  document.getElementById(FLASH_PANEL_ID)?.remove();
  document.querySelectorAll(`[id^="${ACTION_PANEL_PREFIX}"]`).forEach((el) => el.remove());
  document.querySelectorAll(`.${DEBUG_MARKER_CLASS}`).forEach((el) => el.remove());
  document.querySelectorAll(`.${ROW_MARKER_CLASS}`).forEach((el) => el.remove());
}

export async function refreshState() {
  if (isRefreshing) {
    return { ok: false, refreshing: true, url: window.location.href };
  }
  if (!reinit) {
    console.warn('[Dandelion] refreshState called before setReinit');
    return { ok: false, reason: 'no-reinit', url: window.location.href };
  }

  isRefreshing = true;
  try {
    teardown();
    await reinit();
    return { ok: true, url: window.location.href };
  } finally {
    isRefreshing = false;
  }
}
