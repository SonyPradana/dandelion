export async function fillPenyandangDisabilitas(value) {
  const target = value.trim().toLowerCase();

  const labels = document.querySelectorAll('div.mb-1.font-semibold');
  let wrapper = null;
  for (const label of labels) {
    if (label.textContent.includes('Penyandang disabilitas')) {
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
        if (o.textContent.trim().toLowerCase() === target) return resolve(o);
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
