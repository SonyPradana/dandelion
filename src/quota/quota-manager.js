import { verifyLicense } from './verify.js';
import { getCache, setCache } from './cache.js';
import { getTodaySummary } from '../utils/productivityTracker.js';
import { store as globalStore } from '../store.js';

const FREE_PLAN = {
  features: [],
  total_limit: 0,
  daily_limit: 50,
};

const WEIGHTS = {
  radio: 1,
  freetext: 1,
  dropdown: 1,
  formNotChecked: 5,
  formZen: 5,
  registerForm: 100,
};
const CATEGORIES = ['radio', 'freetext', 'dropdown', 'formNotChecked', 'formZen', 'registerForm'];

const _state = {
  status: 'none',
  payload: null,
  isFreePlan: true,
  deviceId: null,
};

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
async function getOrCreateDeviceId(store = globalStore) {
  try {
    const existing = await store.getDeviceId();
    if (existing) {
      _state.deviceId = existing;
      return;
    }
    const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += CHARS[Math.floor(Math.random() * 62)];
    }
    await store.setDeviceId(id);
    _state.deviceId = id;
  } catch {
    _state.deviceId = null;
  }
}

function versionMatch(pattern, version) {
  if (pattern === '*') return true;
  if (pattern.endsWith('.*')) {
    return version.startsWith(pattern.slice(0, -1));
  }
  return pattern === version;
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function init(store = globalStore) {
  await getOrCreateDeviceId(store);

  const cached = await getCache(store);
  if (cached) {
    _state.status = cached.status;
    _state.payload = cached.payload || { ...FREE_PLAN };
    _state.isFreePlan = cached.status !== 'valid';
    console.log(`[Dandelion] Quota: ${cached.status} (cached)`);
    return;
  }

  try {
    const jwt = await store.getQuotaToken();

    if (!jwt) {
      _state.status = 'none';
      _state.payload = { ...FREE_PLAN };
      _state.isFreePlan = true;
      await setCache({ status: 'none', payload: null }, store);
      console.log('[Dandelion] Quota: none (free tier)');
      return;
    }

    const payload = await verifyLicense(jwt);

    if (!payload) {
      _state.status = 'none';
      _state.payload = { ...FREE_PLAN };
      _state.isFreePlan = true;
      await setCache({ status: 'none', payload: null }, store);
      console.log('[Dandelion] Quota: invalid/expired (free tier)');
      return;
    }

    const currentVersion = store.getManifestVersion();
    if (
      Array.isArray(payload.version_allowed) &&
      payload.version_allowed.length > 0 &&
      !payload.version_allowed.some((p) => versionMatch(p, currentVersion))
    ) {
      _state.status = 'none';
      _state.payload = { ...FREE_PLAN };
      _state.isFreePlan = true;
      await setCache({ status: 'none', payload: null }, store);
      console.log(
        `[Dandelion] Quota: version mismatch (${currentVersion} not in [${payload.version_allowed.join(',')}]) (free tier)`,
      );
      return;
    }

    if (payload.license_id && payload.license_id !== _state.deviceId) {
      _state.status = 'none';
      _state.payload = { ...FREE_PLAN };
      _state.isFreePlan = true;
      await setCache({ status: 'none', payload: null }, store);
      return;
    }

    _state.status = 'valid';
    _state.payload = payload;
    _state.isFreePlan = false;
    await setCache({ status: 'valid', payload }, store);
    console.log(`[Dandelion] Quota: valid (total_limit=${payload.total_limit})`);
  } catch (error) {
    console.error('[Dandelion] Quota init error:', error);
    _state.status = 'none';
    _state.payload = { ...FREE_PLAN };
    _state.isFreePlan = true;
  }
}

export function getStatus() {
  return {
    status: _state.status,
    isFreePlan: _state.isFreePlan,
    payload: _state.payload,
    tokenId: _state.payload?.license_id || null,
    deviceId: _state.deviceId,
  };
}

export function getDeviceId() {
  return _state.deviceId;
}

export function isFeatureEnabled(name) {
  if (_state.isFreePlan) return true;
  return Array.isArray(_state.payload?.features) && _state.payload.features.includes(name);
}

export function getDailyCap() {
  if (_state.isFreePlan) return FREE_PLAN.daily_limit;
  return Infinity;
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function getRemainingToday(store = globalStore) {
  if (_state.isFreePlan) {
    const cap = FREE_PLAN.daily_limit;
    try {
      const today = await getTodaySummary(store);
      const used = today ? today.dayTotal : 0;
      return Math.max(0, cap - used);
    } catch {
      return cap;
    }
  }

  return Infinity;
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function isLimitReached(store = globalStore) {
  const remaining = await getRemainingToday(store);
  return remaining <= 0;
}

function calcWeightedCount(counts) {
  let total = 0;
  for (const cat of CATEGORIES) {
    const val = counts[cat];
    if (typeof val === 'number' && val > 0) {
      total += val * (WEIGHTS[cat] || 1);
    }
  }
  return total;
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function canUseTokens(counts, store = globalStore) {
  const weightedCount = calcWeightedCount(counts);
  if (weightedCount <= 0) return { canUse: true, reason: null };

  try {
    const today = await getTodaySummary(store);
    const usedToday = today ? today.dayTotal : 0;
    const grandTotal = today ? today.grandTotal : 0;

    if (_state.isFreePlan) {
      const dailyCap = FREE_PLAN.daily_limit;
      if (usedToday + weightedCount > dailyCap) {
        const remaining = Math.max(0, dailyCap - usedToday);
        return { canUse: false, reason: `Free limit reached (${remaining} remaining today)` };
      }
      return { canUse: true, reason: null };
    }

    const totalLimit = _state.payload?.total_limit || 0;

    if (totalLimit === 0 || grandTotal + weightedCount <= totalLimit) {
      return { canUse: true, reason: null };
    }

    const graceLimit = _state.payload?.daily_limit || 100;
    if (usedToday + weightedCount > graceLimit) {
      return { canUse: false, reason: `Grace limit reached (${graceLimit}/day)` };
    }

    return { canUse: true, reason: null };
  } catch {
    return { canUse: true, reason: null };
  }
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function saveToken(jwtString, store = globalStore) {
  if (typeof jwtString !== 'string' || jwtString.trim().length === 0) {
    throw new Error('Invalid token string');
  }
  await getOrCreateDeviceId(store);
  const payload = await verifyLicense(jwtString.trim());
  if (!payload) {
    throw new Error('Token tidak valid atau sudah kadaluarsa');
  }
  if (payload.license_id && payload.license_id !== _state.deviceId) {
    throw new Error('Token tidak terikat dengan device ini');
  }
  await store.saveQuotaToken(jwtString.trim());
  await store.clearCache();
  await init(store);
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function removeToken(store = globalStore) {
  await store.removeQuotaToken();
  await store.clearCache();
  _state.status = 'none';
  _state.payload = { ...FREE_PLAN };
  _state.isFreePlan = true;
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function getToken(store = globalStore) {
  return await store.getQuotaToken();
}
