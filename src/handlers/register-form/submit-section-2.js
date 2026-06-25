function waitForSubmitButton(timeout = 10_000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const btn = document.querySelector('button[type="submit"].btn-fill-primary');
      if (btn) return resolve(btn);
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, 300);
    };
    poll();
  });
}

export async function submitSection2() {
  const selanjutnya = await waitForSubmitButton();
  if (!selanjutnya) return false;
  selanjutnya.click();
  return true;
}
