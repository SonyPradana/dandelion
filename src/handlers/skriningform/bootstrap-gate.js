const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  mei: 5,
  jun: 6,
  jul: 7,
  agu: 8,
  agt: 8,
  sep: 9,
  okt: 10,
  nov: 11,
  des: 12,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @param {Element} el */
function text(el) {
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

/** @param {Element} el */
function isUsable(el) {
  return (
    el.isConnected &&
    !el.disabled &&
    !el.classList.contains('cursor-not-allowed') &&
    el.getAttribute('aria-disabled') !== 'true'
  );
}

/**
 * @param {string} label
 * @param {ParentNode} [root=document]
 * @returns {HTMLButtonElement|null}
 */
function findButton(label, root = document) {
  return (
    Array.from(root.querySelectorAll('button')).find(
      (button) => isUsable(button) && text(button) === label,
    ) || null
  );
}

function isFormReady() {
  return Boolean(document.querySelector('[data-name], [id^="rowfrm"], [id^="row-FRM"]'));
}

function findDateModal() {
  return (
    Array.from(document.querySelectorAll('.rounded-lg.bg-white.p-4')).find(
      (modal) => modal.isConnected && text(modal).includes('Konfirmasi Tanggal Pemeriksaan'),
    ) || null
  );
}

/**
 * @param {() => any} probe
 * @param {number} timeout
 * @returns {Promise<any>}
 */
async function waitFor(probe, timeout) {
  const start = Date.now();
  while (Date.now() - start <= timeout) {
    const result = probe();
    if (result) return result;
    await wait(200);
  }
  return null;
}

/**
 * @param {Element} modal
 * @returns {{ month: number, year: number, arrows: HTMLButtonElement[] }|null}
 */
function calendarHeader(modal) {
  const buttons = Array.from(modal.querySelectorAll('button'));
  const monthBtn = buttons.find((button) => MONTHS[text(button).slice(0, 3).toLowerCase()]);
  const yearBtn = buttons.find((button) => /^\d{4}$/.test(text(button)));
  if (!monthBtn || !yearBtn) return null;

  const header = monthBtn.parentElement?.parentElement;
  const arrows = header
    ? Array.from(header.querySelectorAll('button')).filter(
        (button) => button !== monthBtn && button !== yearBtn && button.querySelector('svg'),
      )
    : [];

  return {
    month: MONTHS[text(monthBtn).slice(0, 3).toLowerCase()],
    year: Number(text(yearBtn)),
    arrows,
  };
}

/**
 * Parse a date from flash data. Returns null for empty or invalid values.
 *
 * @param {unknown} value
 * @returns {{ day: number, month: number, year: number }|null}
 */
export function parseExaminationDate(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;

  const parts = String(value).trim().split(/[/-]/).map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;

  let [day, month, year] = parts;
  if (parts[0] > 31) [year, month, day] = parts;

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { day, month, year };
}

/**
 * Select a date in the open confirmation modal. Returns false when the
 * calendar cannot reach or click the requested date.
 *
 * @param {Element} modal
 * @param {{ day: number, month: number, year: number }} target
 * @returns {Promise<boolean>}
 */
export async function selectDateInModal(modal, target) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const header = calendarHeader(modal);
    if (!header || header.arrows.length < 2) return false;
    if (header.month === target.month && header.year === target.year) break;

    const earlier =
      target.year < header.year || (target.year === header.year && target.month < header.month);
    const arrow = earlier ? header.arrows[0] : header.arrows[1];
    if (!isUsable(arrow)) return false;

    const before = `${header.year}-${header.month}`;
    arrow.click();
    const after = await waitFor(() => {
      const next = calendarHeader(modal);
      return next && `${next.year}-${next.month}` !== before ? next : null;
    }, 600);
    if (!after) return false;
  }

  const header = calendarHeader(modal);
  if (!header || header.month !== target.month || header.year !== target.year) return false;

  const dayBtn = findButton(String(target.day), modal);
  if (!dayBtn) return false;
  dayBtn.click();
  return true;
}

/**
 * @param {Element} modal
 * @param {Record<string, any>} flashData
 * @param {number} simpanTimeout
 * @returns {Promise<'no-simpan'|'done'>}
 */
async function confirmDateModal(modal, flashData, simpanTimeout) {
  const value = flashData?.pinneds?.['tanggal pemeriksaan'] ?? flashData?.['tanggal pemeriksaan'];
  const date = parseExaminationDate(value);
  if (date) await selectDateInModal(modal, date);

  const simpan = await waitFor(() => findButton('Simpan', modal), simpanTimeout);
  if (!simpan) return 'no-simpan';

  simpan.click();
  await waitFor(() => !findDateModal(), 5000);
  return 'done';
}

/**
 * Click the site's skrining gate and confirm the examination date.
 * Missing gate/date controls are left for the user to handle manually.
 *
 * @param {Record<string, any>} flashData
 * @param {{ gateTimeout?: number, modalTimeout?: number, simpanTimeout?: number }} [timeouts]
 * @returns {Promise<'no-gate'|'no-modal'|'no-simpan'|'done'>}
 */
export async function bootstrapSkriningGate(
  flashData,
  { gateTimeout = 5000, modalTimeout = 5000, simpanTimeout = 2000 } = {},
) {
  const existingModal = findDateModal();
  if (existingModal) return confirmDateModal(existingModal, flashData, simpanTimeout);

  const gate = await waitFor(() => {
    const button = findButton('Mulai Pemeriksaan');
    if (button) return button;
    return isFormReady() ? 'ready' : null;
  }, gateTimeout);

  if (!gate || gate === 'ready') return 'no-gate';
  gate.click();

  const modal = await waitFor(findDateModal, modalTimeout);
  if (!modal) return 'no-modal';
  return confirmDateModal(modal, flashData, simpanTimeout);
}
