export async function clickCekNik() {
  const timeout = 5000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.trim().includes('Cek NIK'),
    );
    if (btn) {
      btn.click();
      return true;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

export async function waitForCekNikResponse() {
  const timeout = 7000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (document.querySelector('#toast--response-fetch.show')) return 'not-found';
    if (document.body.textContent.includes('Data Peserta ditemukan')) return 'found';
    await new Promise((r) => setTimeout(r, 200));
  }
  return 'timeout';
}
