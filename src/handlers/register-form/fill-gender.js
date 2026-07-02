const ALIAS_MAP = [
  { aliases: ['laki-laki', 'laki', 'pria', 'l'], value: 'Laki-laki' },
  { aliases: ['perempuan', 'wanita', 'p', 'perempuan'], value: 'Perempuan' },
];

function normalizeValue(input) {
  const normalized = input.trim().toLowerCase();
  for (const { aliases, value } of ALIAS_MAP) {
    if (
      aliases.includes(normalized) ||
      aliases.some((a) => a.includes(normalized) || normalized.includes(a))
    ) {
      return value;
    }
  }
  return null;
}

export async function fillJenisKelamin(value) {
  const targetValue = normalizeValue(value);
  if (!targetValue) return false;

  const labels = document.querySelectorAll('div.mb-1.font-semibold.text-xs');
  let wrapper = null;
  for (const label of labels) {
    if (label.textContent.includes('Jenis Kelamin')) {
      wrapper = label.closest('[show-icon-reset="false"]');
      break;
    }
  }
  if (!wrapper) return false;

  const allClickable = wrapper.querySelectorAll('[class*="cursor-pointer"]');
  const trigger = Array.from(allClickable).find((el) => !el.closest('.absolute'));
  if (!trigger) return false;
  trigger.click();

  const opt = await new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const options = wrapper.querySelectorAll('.py-2.px-4.cursor-pointer.text-sm');
      for (const o of options) {
        if (o.textContent.trim().toLowerCase() === targetValue.toLowerCase()) return resolve(o);
      }
      if (Date.now() - start > 3000) return resolve(null);
      setTimeout(poll, 100);
    };
    poll();
  });

  if (!opt) return false;
  opt.click();
  return true;
}
