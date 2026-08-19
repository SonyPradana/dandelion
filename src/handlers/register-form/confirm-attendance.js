import { notify } from '../../components/notification';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForKonfirmasiHadir(timeout = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === 'Konfirmasi Hadir') return resolve(btn);
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function waitForTandaiHadirModal(timeout = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modals = document.querySelectorAll('.rounded-lg.bg-white.p-4');
      for (const m of modals) {
        if (m.textContent.includes('Tandai Hadir?')) return resolve(m);
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function waitForHadirEnabled(timeout = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === 'Hadir' && !btn.closest('[class*="cursor-not-allowed"]')) {
          return resolve(btn);
        }
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function waitForBerhasilHadirModal(timeout = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modals = document.querySelectorAll('.rounded-lg.bg-white.p-4');
      for (const m of modals) {
        if (m.textContent.includes('Berhasil Hadir')) return resolve(m);
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function findTutup(modal) {
  const btns = modal.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.textContent.trim() === 'Tutup') return btn;
  }
  return null;
}

function findTicketInModal(modal) {
  const labels = modal.querySelectorAll('.font-semibold');
  for (const label of labels) {
    if (label.textContent.trim() === 'Nomor Tiket:') {
      const ticket = label.nextElementSibling?.textContent?.trim() || null;
      if (ticket) return ticket;
    }
  }
  const match = modal.textContent.match(/No\.?\s*Tiket:?\s*([A-Za-z0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Detect the current sub-position within the "search & mark present" flow.
 *
 * @returns {'search'|'confirm'|'hadir'|'done'|null}
 */
export function detectAttendancePosition() {
  const modals = document.querySelectorAll('.rounded-lg.bg-white.p-4');
  for (const m of modals) {
    if (m.textContent.includes('Berhasil Hadir')) return 'done';
  }
  for (const m of modals) {
    if (m.textContent.includes('Tandai Hadir?')) return 'hadir';
  }
  if (document.querySelector('[id^="dandelion-countdown-"]')) return 'hadir';
  if (document.getElementById('searchNik')) {
    const hasKonfirm = Array.from(document.querySelectorAll('button')).some(
      (btn) => btn.textContent.trim() === 'Konfirmasi Hadir',
    );
    return hasKonfirm ? 'confirm' : 'search';
  }
  return null;
}

/**
 * Search for the participant and open the "Mark Present?" confirmation modal.
 *
 * @param {string} nik
 * @param {{ skip?: boolean }} [options]
 * @returns {Promise<{ modal: Element, ticket: string|null }|null>}
 */
export async function searchAttendance(nik, { skip = false } = {}) {
  if (!skip) {
    const input = document.getElementById('searchNik');
    if (!input) return null;

    input.value = nik;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(300);

    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true,
      }),
    );

    const konfirmBtn = await waitForKonfirmasiHadir();
    if (!konfirmBtn) return null;
    konfirmBtn.click();
  }

  const modal = await waitForTandaiHadirModal();
  if (!modal) return null;

  return { modal, ticket: findTicketInModal(modal) };
}

/**
 * Complete the manual attendance via countdown and the "Successfully Present" modal.
 *
 * @param {string|null} ticket
 * @param {number} [countdownDuration=5000]
 * @returns {Promise<string|null|false>}
 */
export async function completeAttendance(ticket, countdownDuration = 5000) {
  const checkDiv = document.querySelector('#verify.check');
  if (checkDiv) {
    checkDiv.click();
    await wait(200);
  }

  const { promise } = notify.countdown(
    'Tandai Hadir',
    'Klik tombol "Hadir" secara manual',
    countdownDuration,
  );

  const countdownResult = await promise;

  if (!countdownResult) {
    await wait(200);
    const m = await waitForBerhasilHadirModal(1000);
    if (!m) return false;
  }

  const existing = await waitForBerhasilHadirModal(1000);
  if (!existing) {
    const hadirBtn = await waitForHadirEnabled(countdownDuration);
    if (!hadirBtn) return false;
    hadirBtn.click();
  }

  const successModal = await waitForBerhasilHadirModal(countdownDuration);
  if (!successModal) return null;

  const tutup = findTutup(successModal);
  if (tutup) tutup.click();

  await wait(500);
  return ticket || null;
}

/**
 * Finish the flow when the "Successfully Present" modal is already open (position 'done').
 *
 * @returns {Promise<string|null>}
 */
export async function completeDoneAttendance() {
  const modal = await waitForBerhasilHadirModal(1000);
  if (!modal) return null;

  const ticket = findTicketInModal(modal);
  const tutup = findTutup(modal);
  if (tutup) tutup.click();

  await wait(500);
  return ticket || null;
}

export async function confirmAttendance(nik, countdownDuration = 5000) {
  const result = await searchAttendance(nik);
  if (!result) return false;
  return completeAttendance(result.ticket, countdownDuration);
}
