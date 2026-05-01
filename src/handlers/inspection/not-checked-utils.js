/**
 * Deteksi apakah halaman siap diproses (Sedang Pemeriksaan).
 */
export function isPageInProcessingState() {
  const content = document.body.textContent || '';
  const hasProcessingText = content.includes('Sedang Pemeriksaan');

  const hasFinishButton = Array.from(document.querySelectorAll('button, div')).some(
    (el) => el.textContent.includes('Selesaikan Layanan') && !el.classList.contains('cursor-not-allowed'),
  );

  return hasProcessingText || hasFinishButton;
}

/**
 * Menghitung statistik antrian berdasarkan Master List dan kondisi DOM.
 */
export function getQueueStats(masterList) {
  const foundIds = [];
  const pendingIds = [];
  const doneIds = [];

  masterList.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      foundIds.push(id);
      const row = el.closest('.grid');
      const text = row ? row.textContent : '';

      if (text.includes('Tidak diperiksa') || text.includes('Selesai diperiksa')) {
        doneIds.push(id);
      } else {
        pendingIds.push(id);
      }
    }
  });

  return { foundIds, pendingIds, doneIds };
}

/**
 * Menunggu elemen baris muncul di DOM.
 */
export function waitForRow(id, timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const check = () => {
      const el = document.getElementById(id);
      if (el) resolve(el);
      else if (Date.now() - startTime > timeout) resolve(null);
      else setTimeout(check, 500);
    };
    check();
  });
}

/**
 * Menunggu elemen spesifik muncul berdasarkan selector dan teks.
 */
export function waitForElement(selector, textContent, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const elements = Array.from(document.querySelectorAll(selector));
      const found = elements.find((el) => el.textContent.includes(textContent));
      if (found) resolve(found);
      else if (Date.now() - startTime > timeout) reject(new Error('Timeout'));
      else setTimeout(check, 500);
    };
    check();
  });
}
