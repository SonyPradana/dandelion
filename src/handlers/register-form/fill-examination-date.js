function parseDate(value) {
  if (!value) return new Date();
  const parts = value.split('-');
  if (parts.length === 3 && parts[0].length <= 2) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  return new Date(value);
}

export function fillTanggalPemeriksaan(value) {
  const today = parseDate(value);
  const day = today.getDate();

  const daySpans = document.querySelectorAll(String.raw`span.font-bold.text-\[18px\]`);
  for (const span of daySpans) {
    if (parseInt(span.textContent.trim()) === day) {
      const btn = span.closest('button');
      if (btn) {
        btn.click();
        return true;
      }
    }
  }
  return false;
}
