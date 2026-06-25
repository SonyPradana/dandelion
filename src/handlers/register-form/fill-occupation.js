export async function fillPekerjaan(value) {
  const target = value.trim().toLowerCase();

  const labels = document.querySelectorAll('div.mb-1.font-semibold');
  let wrapper = null;
  for (const label of labels) {
    if (label.textContent.includes('Pekerjaan')) {
      wrapper = label.closest('.w-full');
      break;
    }
  }
  if (!wrapper) return false;

  const trigger = wrapper.querySelector('[class*="cursor-pointer"]');
  if (!trigger) return false;
  trigger.click();

  const found = await new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modal = document.querySelector('.modal-content');
      if (modal) {
        const buttons = modal.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.trim().toLowerCase();
          if (!text) continue;
          if (text === target || text.includes(target)) return resolve(btn);
        }
      }
      if (Date.now() - start > 5000) return resolve(null);
      setTimeout(poll, 100);
    };
    poll();
  });

  if (!found) return false;
  found.click();
  return true;
}
