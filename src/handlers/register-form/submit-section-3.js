function waitForFormModal(timeout = 12_000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modals = document.querySelectorAll('.fixed.flex.justify-center.items-center');
      for (const m of modals) {
        if (m.textContent.includes('Formulir Pendaftaran')) return resolve(m);
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function findPilihButton(modal, timeout = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const btns = modal.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === 'Pilih') return resolve(btn);
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function waitForDaftarEnabled(timeout = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modals = document.querySelectorAll('.fixed.flex.justify-center.items-center');
      for (const m of modals) {
        const buttons = m.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.trim() === 'Daftarkan dengan NIK') {
            return resolve(btn);
          }
        }
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function waitForSuccessModal(timeout = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modals = document.querySelectorAll('.rounded-lg.bg-white.p-4');
      for (const m of modals) {
        if (m.textContent.includes('Berhasil Daftar')) return resolve(m);
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function findTutupButton(modal) {
  const btns = modal.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.textContent.trim() === 'Tutup') return btn;
  }
  return null;
}

export async function submitSection3(timeout = 12_000) {
  const modal = await waitForFormModal(timeout);
  if (!modal) return false;

  const pilih = await findPilihButton(modal);
  if (!pilih) return false;
  pilih.click();
  await new Promise((r) => setTimeout(r, 300));

  const daftar = await waitForDaftarEnabled(timeout);
  if (!daftar) return false;
  daftar.click();

  const success = await waitForSuccessModal(timeout);
  if (!success) return false;

  const tutup = findTutupButton(success);
  if (!tutup) return false;
  tutup.click();

  return true;
}
