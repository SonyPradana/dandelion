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
          let partial = null;
          for (const btn of buttons) {
            const text = btn.textContent.trim().toLowerCase();
            if (!text) continue;
            if (text === target) return resolve(btn);
            if (!partial && text.includes(target)) partial = btn;
          }
          if (partial) return resolve(partial);
        }
      }
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 100);
    };
    poll();
  });
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
    let btn = await waitForLevel(level.subtitle, level.value);
    if (!btn) {
      await wait(500);
      btn = await waitForLevel(level.subtitle, level.value);
    }
    if (!btn) return false;
    btn.click();
  }

  return true;
}
