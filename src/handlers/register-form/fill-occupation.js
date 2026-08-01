function normalize(value) {
  return value.trim().split(' ').filter(Boolean).join(' ').toLowerCase();
}

function isOccupationModal(modal) {
  return normalize(modal.textContent).includes('pilih pekerjaan');
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fillPekerjaan(value, firstPickTimeout = 3000, retryTimeout = 10_000) {
  const target = normalize(value);

  const labels = document.querySelectorAll('div.mb-1.font-semibold');
  let wrapper = null;
  for (const label of labels) {
    if (label.textContent.includes('Pekerjaan')) {
      wrapper = label.parentElement;
      break;
    }
  }
  if (!wrapper) return false;

  let trigger = wrapper.querySelector('[class*="cursor-pointer"]');
  if (!trigger) return false;

  const pick = (timeout) =>
    new Promise((resolve) => {
      const start = Date.now();
      const poll = () => {
        const modals = document.querySelectorAll('.modal-content');
        for (const modal of modals) {
          if (!isOccupationModal(modal)) continue;
          const buttons = modal.querySelectorAll('button');
          for (const btn of buttons) {
            const text = normalize(btn.textContent);
            if (!text) continue;
            if (text === target || text.includes(target)) return resolve(btn);
          }
        }
        if (Date.now() - start > timeout) return resolve(null);
        setTimeout(poll, 100);
      };
      poll();
    });

  trigger.click();
  let found = await pick(firstPickTimeout);

  if (!found) {
    const open = Array.from(document.querySelectorAll('.modal-content')).find(isOccupationModal);
    if (open) {
      const closeBtn = open.querySelector('button.p-0.border-none');
      if (closeBtn) {
        closeBtn.click();
      } else {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
    }
    await wait(500);
    trigger = wrapper.querySelector('[class*="cursor-pointer"]');
    if (trigger) trigger.click();
    found = await pick(retryTimeout);
  }

  if (!found) return false;
  found.click();
  return true;
}
