import { store as globalStore } from '../store.js';

const STORAGE_KEY = 'productivity_stats';

const CATEGORIES = ['radio', 'freetext', 'dropdown', 'formNotChecked', 'formZen'];

export const WEIGHT_VERSION = 1;
export const WEIGHTS = { radio: 1, freetext: 1, dropdown: 1, formNotChecked: 5, formZen: 5 };
export const MONTHLY_TARGET = 30_000;
export const TARGET_MODE = 'weekly';
export const DAILY_LIMIT = 13_200;

function getWeights(data) {
  return data._meta?.weights || WEIGHTS;
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyDay() {
  const entry = { dayTotal: 0, grandTotal: 0 };
  for (const cat of CATEGORIES) entry[cat] = 0;
  return entry;
}

function yesterdayKey(current) {
  const d = new Date(current);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function loadAll(store = globalStore) {
  return await store.loadProductivityData();
}

async function saveAll(data, store = globalStore) {
  await store.saveProductivityData(data);
}

function recalcDay(data, key) {
  const entry = data[key];
  if (!entry) return;

  const w = getWeights(data);
  let sum = 0;
  for (const cat of CATEGORIES) sum += (entry[cat] || 0) * (w[cat] || 1);
  entry.dayTotal = sum;

  const yKey = yesterdayKey(key);
  const prevGrand = data[yKey] ? data[yKey].grandTotal : 0;
  entry.grandTotal = prevGrand + entry.dayTotal;
}

export async function incrementBatch(counts, store = globalStore) {
  const data = await loadAll(store);
  const key = todayKey();
  if (!data[key]) data[key] = emptyDay();

  for (const cat of CATEGORIES) {
    const val = counts[cat];
    if (typeof val === 'number' && val > 0) {
      data[key][cat] = (data[key][cat] || 0) + val;
    }
  }

  data._meta = { weightVersion: WEIGHT_VERSION, weights: WEIGHTS };
  recalcDay(data, key);
  await saveAll(data, store);
}

export async function increment(category, store = globalStore) {
  if (!CATEGORIES.includes(category)) {
    console.warn(`[Productivity] Unknown category: ${category}`);
    return;
  }
  await incrementBatch({ [category]: 1 }, store);
}

export async function getDaySummary(dateKey, store = globalStore) {
  const data = await loadAll(store);
  const entry = data[dateKey];
  if (!entry) return null;

  const counts = {};
  for (const cat of CATEGORIES) counts[cat] = entry[cat] || 0;

  return { date: dateKey, counts, dayTotal: entry.dayTotal, grandTotal: entry.grandTotal };
}

export async function getTodaySummary(store = globalStore) {
  return getDaySummary(todayKey(), store);
}

export async function getYesterdaySummary(store = globalStore) {
  return getDaySummary(yesterdayKey(todayKey()), store);
}

export async function getRange(fromDate, toDate, store = globalStore) {
  const result = [];
  const from = new Date(fromDate);
  const end = new Date(toDate);
  const msPerDay = 86_400_000;
  const days = Math.floor((end - from) / msPerDay) + 1;

  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(await getDaySummary(`${y}-${m}-${day}`, store));
  }

  return result;
}

export async function getMonthTotal(store = globalStore) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const first = `${y}-${m}-01`;
  const today = todayKey();

  const range = await getRange(first, today, store);
  return range.reduce((sum, day) => sum + (day ? day.dayTotal : 0), 0);
}

export async function getWeekTotal(store = globalStore) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  const first = `${y}-${m}-${d}`;
  const today = todayKey();

  const range = await getRange(first, today, store);
  return range.reduce((sum, day) => sum + (day ? day.dayTotal : 0), 0);
}

export async function getOverallBreakdown(store = globalStore) {
  const data = await loadAll(store);
  const keys = Object.keys(data)
    .filter((k) => k !== '_meta')
    .toSorted();

  const counts = {};
  for (const cat of CATEGORIES) counts[cat] = 0;

  let grandTotal = 0;
  let activeDays = 0;

  for (const key of keys) {
    const entry = data[key];
    if (!entry) continue;
    for (const cat of CATEGORIES) counts[cat] += entry[cat] || 0;
    if (entry.dayTotal > 0) activeDays++;
    if (entry.grandTotal > grandTotal) grandTotal = entry.grandTotal;
  }

  const average = activeDays > 0 ? Math.round(grandTotal / activeDays) : 0;

  return { counts, grandTotal, activeDays, average };
}

export async function getFullHistory(store = globalStore) {
  return await loadAll(store);
}

export async function isDailyLimitReached(store = globalStore) {
  const today = await getTodaySummary(store);
  return today ? today.dayTotal >= DAILY_LIMIT : false;
}

export async function validateChain(store = globalStore) {
  const data = await loadAll(store);
  const weights = getWeights(data);
  const errors = [];
  const keys = Object.keys(data)
    .filter((k) => k !== '_meta')
    .toSorted();

  let totalChecked = 0;
  let mismatches = 0;

  for (const key of keys) {
    const entry = data[key];
    if (!entry || entry.dayTotal === undefined) continue;
    totalChecked++;

    let computedDayTotal = 0;
    for (const cat of CATEGORIES) {
      computedDayTotal += (entry[cat] || 0) * (weights[cat] || 1);
    }
    if (computedDayTotal !== entry.dayTotal) {
      errors.push(`[dayTotal] ${key}: stored ${entry.dayTotal} ≠ computed ${computedDayTotal}`);
      mismatches++;
    }

    const prevKey = yesterdayKey(key);
    const prevEntry = data[prevKey];
    const expectedGrand = (prevEntry ? prevEntry.grandTotal : 0) + (entry.dayTotal || 0);
    if (entry.grandTotal !== expectedGrand) {
      errors.push(
        `[grandTotal] ${key}: stored ${entry.grandTotal} ≠ expected ${expectedGrand} (prev=${prevEntry?.grandTotal ?? 0} + day=${entry.dayTotal})`,
      );
      mismatches++;
    }
  }

  const valid = mismatches === 0;
  return { valid, errors, totalChecked, mismatches };
}

export async function migrateWeights(store = globalStore) {
  const data = await loadAll(store);
  const keys = Object.keys(data)
    .filter((k) => k !== '_meta')
    .toSorted();

  data._meta = { weightVersion: WEIGHT_VERSION, weights: WEIGHTS };

  for (const key of keys) {
    recalcDay(data, key);
  }

  await saveAll(data, store);
  console.log(`[Migrate] Recalculated ${keys.length} entries with weights v${WEIGHT_VERSION}`);
}
