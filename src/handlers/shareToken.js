import { shareTokenButton } from '../components/shareTokenButton';
import { controlPanel } from '../components/controlPanel';
import { notify } from '../components/notification';
import { verifyLicense } from '../quota/verify.js';
import { applyShareToken, getDeviceId } from '../quota/quota-manager.js';

const TOKEN_SELECTORS = ['#jwtOutput', '[data-dandelion-token]'];

/**
 * Detects a share-token page by its path.
 * Uses exact segment matching (no regex).
 * Host is only enforced when an official host is provided and is not the
 * local dev marker, otherwise any host is accepted (dev environment).
 * @param {string} url
 * @param {string} [officialHost] - Official extension host (from env HOST).
 * @returns {boolean}
 */
export function isShareTokenUrl(url, officialHost = '') {
  let parsed = null;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  const isSharePath = segments[0] === 's' || segments[0] === 'share';
  if (!isSharePath || !segments[1]) return false;

  if (officialHost && officialHost !== 'localhost') {
    return parsed.hostname === officialHost;
  }

  return true;
}

function findTokenElement() {
  for (const selector of TOKEN_SELECTORS) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function readToken() {
  const el = findTokenElement();
  if (!el) return '';
  const explicit = el.getAttribute?.('data-dandelion-token');
  if (explicit) return explicit.trim();
  if (typeof el.value === 'string') return el.value.trim();
  return (el.textContent || '').trim();
}

function waitForToken(timeout = 5000) {
  return new Promise((resolve) => {
    const started = Date.now();
    function poll() {
      const token = readToken();
      if (token) {
        resolve(token);
        return;
      }
      if (Date.now() - started >= timeout) {
        resolve('');
        return;
      }
      setTimeout(poll, 150);
    }
    poll();
  });
}

/**
 * Initializes the share-token handler on the share page.
 * Reads the token from the DOM, pre-verifies it, and only enables the
 * "Terapkan" button when the token is valid.
 */
export async function initializeShareToken() {
  const btn = shareTokenButton();
  controlPanel.mount(btn, 1);

  const token = await waitForToken();
  if (!token) return;

  const payload = await verifyLicense(token);
  if (!payload) return;

  const deviceId = getDeviceId();
  if (!deviceId || payload.license_id !== deviceId) return;

  btn.setEnabled(true);

  btn.addEventListener('click', async () => {
    const currentToken = readToken();
    if (!currentToken) return;

    const confirmed = await notify.confirm(
      'Konfirmasi',
      'Yakin ingin menerapkan token ini? Token aktif saat ini akan diganti.',
    );
    if (!confirmed) return;

    btn.setRunning(true);
    try {
      await applyShareToken(currentToken);
      notify.info('Token Diterapkan', 'Token berhasil diterapkan.');
    } catch (error) {
      notify.alert('Gagal', error?.message || 'Token tidak valid atau sudah kadaluarsa.');
    } finally {
      btn.setRunning(false);
    }
  });
}
