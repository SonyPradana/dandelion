export function fillNikWali(entries) {
  const entry = entries.find(([key]) => {
    const k = key.toLowerCase();
    return k.includes('nik') && k.endsWith(' wali');
  });
  if (!entry) return false;

  const input = document.getElementById('nik wali');
  if (!input) return false;

  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  ).set;
  nativeSetter.call(input, entry[1]);
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  return true;
}
