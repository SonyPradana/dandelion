import browser from 'webextension-polyfill';
import { verifyLicense } from './verify.js';
import { getCache, setCache, clearCache } from './cache.js';
import { getTodaySummary } from '../utils/productivityTracker.js';

const QUOTA_TOKEN_KEY = 'dandelion_quota_token';

const FREE_PLAN = {
  features: [],
  total_limit: 0,
  daily_limit: 100,
};

const WEIGHTS = { radio: 1, freetext: 1, dropdown: 1, formNotChecked: 5, formZen: 5 };
const CATEGORIES = ['radio', 'freetext', 'dropdown', 'formNotChecked', 'formZen'];

const _state = {
  status: 'none',
  payload: null,
  isFreePlan: true,
};

export async function init() {
  const cached = await getCache();
  if (cached) {
    _state.status = cached.status;
    _state.payload = cached.payload || { ...FREE_PLAN };
    _state.isFreePlan = cached.status !== 'valid';
    console.log(`[Dandelion] Quota: ${cached.status} (cached)`);
    return;
  }

  try {
    const result = await browser.storage.local.get(QUOTA_TOKEN_KEY);
    const jwt = result[QUOTA_TOKEN_KEY];

    if (!jwt) {
      _state.status = 'none';
      _state.payload = { ...FREE_PLAN };
      _state.isFreePlan = true;
      await setCache({ status: 'none', payload: null });
      console.log('[Dandelion] Quota: none (free tier)');
      return;
    }

    const payload = await verifyLicense(jwt);

    if (!payload) {
      _state.status = 'none';
      _state.payload = { ...FREE_PLAN };
      _state.isFreePlan = true;
      await setCache({ status: 'none', payload: null });
      console.log('[Dandelion] Quota: invalid/expired (free tier)');
      return;
    }

    const currentVersion = browser.runtime.getManifest().version;
    if (
      Array.isArray(payload.version_allowed) &&
      payload.version_allowed.length > 0 &&
      !payload.version_allowed.includes(currentVersion)
    ) {
      _state.status = 'none';
      _state.payload = { ...FREE_PLAN };
      _state.isFreePlan = true;
      await setCache({ status: 'none', payload: null });
      console.log(
        `[Dandelion] Quota: version mismatch (${currentVersion} not in [${payload.version_allowed.join(',')}]) (free tier)`,
      );
      return;
    }

    _state.status = 'valid';
    _state.payload = payload;
    _state.isFreePlan = false;
    await setCache({ status: 'valid', payload });
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
  };
}

export function isFeatureEnabled(name) {
  if (_state.isFreePlan) return true;
  return Array.isArray(_state.payload?.features) && _state.payload.features.includes(name);
}

export function getDailyCap() {
  if (_state.isFreePlan) return FREE_PLAN.daily_limit;
  return Infinity;
}

export async function getRemainingToday() {
  if (_state.isFreePlan) {
    const cap = FREE_PLAN.daily_limit;
    try {
      const today = await getTodaySummary();
      const used = today ? today.dayTotal : 0;
      return Math.max(0, cap - used);
    } catch {
      return cap;
    }
  }

  return Infinity;
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

export async function canUseTokens(counts) {
  const weightedCount = calcWeightedCount(counts);
  if (weightedCount <= 0) return { canUse: true, reason: null };

  try {
    const today = await getTodaySummary();
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

export async function saveToken(jwtString) {
  if (typeof jwtString !== 'string' || jwtString.trim().length === 0) {
    throw new Error('Invalid token string');
  }
  await browser.storage.local.set({ [QUOTA_TOKEN_KEY]: jwtString.trim() });
  await clearCache();
  await init();
}

export async function removeToken() {
  await browser.storage.local.remove(QUOTA_TOKEN_KEY);
  await clearCache();
  _state.status = 'none';
  _state.payload = { ...FREE_PLAN };
  _state.isFreePlan = true;
}

export async function getToken() {
  try {
    const result = await browser.storage.local.get(QUOTA_TOKEN_KEY);
    return result[QUOTA_TOKEN_KEY] || null;
  } catch {
    return null;
  }
}
