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

export async function confirmAttendance(nik, countdownDuration = 5000) {
  const input = document.getElementById('searchNik');
  if (!input) return false;

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
  if (!konfirmBtn) return false;
  konfirmBtn.click();

  const modal = await waitForTandaiHadirModal();
  if (!modal) return false;

  let ticket = null;
  const labels = modal.querySelectorAll('.font-semibold');
  for (const label of labels) {
    if (label.textContent.trim() === 'Nomor Tiket:') {
      ticket = label.nextElementSibling?.textContent?.trim() || null;
      break;
    }
  }

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
