function waitForLevel(subtitle, targetValue, timeout = 5000) {
  const target = targetValue.trim().toLowerCase();
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modal = document.querySelector('.modal-content');
      if (modal) {
        const subtitleEl = Array.from(modal.querySelectorAll('div')).find((d) =>
          d.textContent.trim().includes(subtitle),
        );
        if (subtitleEl) {
          const buttons = modal.querySelectorAll('button');
          for (const btn of buttons) {
            const text = btn.textContent.trim().toLowerCase();
            if (!text) continue;
            if (text === target || text.includes(target)) return resolve(btn);
          }
        }
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 100);
    };
    poll();
  });
}

export async function fillAlamatDomisili(provinsi, kabupaten, kecamatan, kelurahan) {
  const labels = document.querySelectorAll('div.mb-1.font-semibold');
  let container = null;
  for (const label of labels) {
    if (label.textContent.includes('Alamat Domisili')) {
      container = label.parentElement;
      break;
    }
  }
  if (!container) return false;

  const trigger = container.querySelector('[class*="cursor-pointer"]');
  if (!trigger) return false;
  trigger.click();

  const levels = [
    { subtitle: 'Daftar Provinsi', value: provinsi },
    { subtitle: 'Daftar Kabupaten/Kota', value: kabupaten },
    { subtitle: 'Daftar Kecamatan', value: kecamatan },
    { subtitle: 'Daftar Kelurahan', value: kelurahan },
  ];

  for (const level of levels) {
    const btn = await waitForLevel(level.subtitle, level.value);
    if (!btn) return false;
    btn.click();
  }

  return true;
}
