const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function isOnStep2() {
  const bars = document.querySelectorAll(String.raw`.stepper .bg-\[\#16B3AC\]`);
  return bars.length === 2;
}

function waitForSubmitButton(timeout = 10_000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const btn = document.querySelector('button[type="submit"].btn-fill-primary');
      if (btn) return resolve(btn);
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 300);
    };
    poll();
  });
}

function waitForModalButton(modalText, buttonText, timeout = 7000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modals = document.querySelectorAll('.fixed.flex.justify-center.items-center');
      for (const modal of modals) {
        const content = modal.querySelector('.rounded-lg.bg-white.p-4');
        if (content && content.textContent.includes(modalText)) {
          const btns = content.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent.trim() === buttonText) {
              return resolve(btn);
            }
          }
        }
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}

function waitForSubmitResult(timeout = 7000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modals = document.querySelectorAll('.fixed.flex.justify-center.items-center');
      for (const modal of modals) {
        const content = modal.querySelector('.rounded-lg.bg-white.p-4');
        if (!content) continue;

        if (content.textContent.includes('Data peserta valid')) {
          const btns = content.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent.trim() === 'Lanjutkan') {
              return resolve({ type: 'success', btn });
            }
          }
        }

        if (content.textContent.includes('Individu sudah menerima layanan')) {
          const btns = content.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent.trim() === 'Kembali') {
              return resolve({ type: 'blocked', btn });
            }
          }
        }
      }
      if (Date.now() - start > timeout) return resolve({ type: 'timeout' });
      setTimeout(poll, 200);
    };
    poll();
  });
}

export async function submitSection1() {
  const selanjutnya = await waitForSubmitButton();
  if (!selanjutnya) return false;
  selanjutnya.click();

  const lanjutBtn = await waitForModalButton('Kuota Pemeriksaan Habis', 'Lanjut', 5000);
  if (lanjutBtn) {
    lanjutBtn.click();
    await wait(500);
  }

  const result = await waitForSubmitResult(7000);
  if (result.type === 'blocked') {
    result.btn.click();
    return 'blocked';
  }
  if (result.type === 'timeout') return false;

  result.btn.click();
  await wait(800);

  return isOnStep2();
}
