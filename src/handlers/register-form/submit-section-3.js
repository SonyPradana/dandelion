/** @returns {Element|null} */
export function findRegistrationSuccessModal() {
  const modals = document.querySelectorAll('.rounded-lg.bg-white.p-4');
  for (const modal of modals) {
    if (modal.textContent.includes('Berhasil Daftar')) return modal;
  }
  return null;
}

/**
 * @param {Element} modal
 * @returns {string|null}
 */
export function parseTicket(modal) {
  const labels = modal.querySelectorAll('.font-semibold');
  for (const label of labels) {
    if (/^(No\.?\s*Tiket|Nomor Tiket):?$/i.test(label.textContent.trim())) {
      const ticket = label.nextElementSibling?.textContent?.trim() || null;
      if (ticket) return ticket;
    }
  }

  const walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const match = node.nodeValue?.match(/(?:No\.?\s*Tiket|Nomor Tiket)\s*:?\s*(.*)$/i);
    if (!match) continue;

    const inline = match[1].trim();
    if (inline) return inline.split(/\s+/)[0];

    const next = node.parentElement?.nextElementSibling?.textContent?.trim();
    if (next) return next.split(/\s+/)[0];
  }

  return null;
}

/**
 * Wait for the terminal "Berhasil Daftar" modal and read the ticket.
 *
 * @param {number} [timeout=12_000]
 * @returns {Promise<{ status: 'ok', ticket: string|null, modal: Element } |
 *   { status: 'closed', ticket: null, modal: null } |
 *   { status: 'missing', ticket: null, modal: null }>}
 */
export async function submitSection3(timeout = 12_000) {
  let seen = false;

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (findRegistrationSuccessModal()) seen = true;
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const start = Date.now();
    const poll = () => {
      const modal = findRegistrationSuccessModal();
      if (modal) {
        observer.disconnect();
        return resolve({ status: 'ok', ticket: parseTicket(modal), modal });
      }
      if (seen) {
        observer.disconnect();
        return resolve({ status: 'closed', ticket: null, modal: null });
      }
      if (Date.now() - start > timeout) {
        observer.disconnect();
        return resolve({ status: 'missing', ticket: null, modal: null });
      }
      setTimeout(poll, 200);
    };
    poll();
  });
}
