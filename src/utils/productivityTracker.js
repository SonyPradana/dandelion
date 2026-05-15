import browser from 'webextension-polyfill';

const STORAGE_KEY = 'dandelion_productivity_stats';

const CATEGORIES = ['radio', 'freetext', 'dropdown', 'formNotChecked', 'formZen'];

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

async function loadAll() {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {};
  } catch {
    return {};
  }
}

async function saveAll(data) {
  await browser.storage.local.set({ [STORAGE_KEY]: data });
}

function recalcDay(data, key) {
  const entry = data[key];
  if (!entry) return;

  let sum = 0;
  for (const cat of CATEGORIES) sum += entry[cat] || 0;
  entry.dayTotal = sum;

  const yKey = yesterdayKey(key);
  const prevGrand = data[yKey] ? data[yKey].grandTotal : 0;
  entry.grandTotal = prevGrand + entry.dayTotal;
}

/**
 * Bulk increment — 1 read + 1 write.
 * @param {Partial<Record<'radio'|'freetext'|'dropdown'|'formNotChecked'|'formZen', number>>} counts
 */
export async function incrementBatch(counts) {
  const data = await loadAll();
  const key = todayKey();
  if (!data[key]) data[key] = emptyDay();

  for (const cat of CATEGORIES) {
    const val = counts[cat];
    if (typeof val === 'number' && val > 0) {
      data[key][cat] = (data[key][cat] || 0) + val;
    }
  }

  recalcDay(data, key);
  await saveAll(data);

  console.log(
    `[Productivity] update | dayTotal: ${data[key].dayTotal} | grandTotal: ${data[key].grandTotal}`,
  );
}

/**
 * Single-category increment.
 * @param {'radio'|'freetext'|'dropdown'|'formNotChecked'|'formZen'} category
 */
export async function increment(category) {
  if (!CATEGORIES.includes(category)) {
    console.warn(`[Productivity] Unknown category: ${category}`);
    return;
  }
  await incrementBatch({ [category]: 1 });
}

/**
 * Get summary for a specific date.
 * @param {string} dateKey - Format 'YYYY-MM-DD'
 * @returns {Promise<{ date: string, counts: Object, dayTotal: number, grandTotal: number }|null>}
 */
export async function getDaySummary(dateKey) {
  const data = await loadAll();
  const entry = data[dateKey];
  if (!entry) return null;

  const counts = {};
  for (const cat of CATEGORIES) counts[cat] = entry[cat] || 0;

  return { date: dateKey, counts, dayTotal: entry.dayTotal, grandTotal: entry.grandTotal };
}

/**
 * Get today's productivity summary.
 * @returns {Promise<{ date: string, counts: Object, dayTotal: number, grandTotal: number }|null>}
 */
export async function getTodaySummary() {
  return getDaySummary(todayKey());
}

/**
 * Get summaries for a date range (inclusive).
 * @param {string} fromDate - Format 'YYYY-MM-DD'
 * @param {string} toDate - Format 'YYYY-MM-DD'
 * @returns {Promise<Array<{ date: string, counts: Object, dayTotal: number, grandTotal: number }|null>>}
 */
export async function getRange(fromDate, toDate) {
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
    result.push(await getDaySummary(`${y}-${m}-${day}`));
  }

  return result;
}

/**
 * Get total dayTotal for the current month (from 1st to today).
 * @returns {Promise<number>}
 */
export async function getMonthTotal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const first = `${y}-${m}-01`;
  const today = todayKey();

  const range = await getRange(first, today);
  return range.reduce((sum, day) => sum + (day ? day.dayTotal : 0), 0);
}

/**
 * Get overall breakdown across all history.
 * @returns {Promise<{ counts: Object, grandTotal: number, activeDays: number, average: number }>}
 */
export async function getOverallBreakdown() {
  const data = await loadAll();
  const keys = Object.keys(data).toSorted();

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

/**
 * Get full history for verification (chain integrity check).
 * @returns {Promise<Object>}
 */
export async function getFullHistory() {
  return await loadAll();
}
