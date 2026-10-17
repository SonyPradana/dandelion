// Copy-as-Markdown for doc pages: fetches the stripped source .md next to the
// page, copies it to the clipboard, and rewrites root-relative /doc/ links to
// absolute URLs so the pasted Markdown points back at the live site.
// Progressive enhancement — without JS the anchor opens the raw file.
(() => {
  const button = document.querySelector('[data-copy-md]');
  if (!(button instanceof HTMLAnchorElement)) return;

  let timer = 0;

  button.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(button.href, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markdown = await response.text();
      await navigator.clipboard.writeText(
        markdown.replaceAll('](/doc/', `](${location.origin}/doc/`),
      );
      button.classList.add('is-copied');
      clearTimeout(timer);
      timer = setTimeout(() => button.classList.remove('is-copied'), 1500);
    } catch {
      location.href = button.href;
    }
  });
})();
