export function fillByCheckId(id, value) {
  const el = document.getElementById(id);
  if (!el) return false;

  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));

  return true;
}
