// Hover-prefetch fallback for engines without the Speculation Rules API
// (Firefox, Safari, older Chromium). On supported engines this file exits
// right away — the static <script type="speculationrules"> block in <head>
// already covers hover, viewport heuristics, and the next/prev warm-up.
(() => {
  if (
    typeof HTMLScriptElement !== 'undefined' &&
    HTMLScriptElement.supports?.('speculationrules')
  ) {
    return;
  }

  const connection = navigator.connection;
  if (connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType ?? '')) return;

  const done = new Set();

  const prefetch = (href) => {
    if (done.has(href)) return;
    done.add(href);
    fetch(href, { credentials: 'same-origin', priority: 'high' }).catch(() => done.delete(href));
  };

  const docLink = (event) => {
    const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(target instanceof HTMLAnchorElement)) return null;
    if (target.origin !== location.origin) return null;
    if (!target.pathname.startsWith('/doc/')) return null;
    if (target.pathname === location.pathname && target.search === location.search) return null;
    if (target.hasAttribute('download')) return null;
    return target;
  };

  let timer = 0;
  let hovered = null;

  const cancel = () => {
    clearTimeout(timer);
    timer = 0;
    hovered = null;
  };

  document.addEventListener('pointerover', (event) => {
    const link = docLink(event);
    if (!link || link === hovered) return;
    cancel();
    hovered = link;
    timer = setTimeout(() => prefetch(link.href), 120);
  });

  document.addEventListener('pointerout', (event) => {
    if (!hovered) return;
    const next = event.relatedTarget;
    if (next instanceof Node && hovered.contains(next)) return;
    cancel();
  });

  document.addEventListener('pointerdown', (event) => {
    const link = docLink(event);
    if (!link) return;
    cancel();
    prefetch(link.href);
  });

  const warmPageNav = () => {
    for (const link of document.querySelectorAll('.page-nav a[href]')) {
      if (link instanceof HTMLAnchorElement && link.origin === location.origin) prefetch(link.href);
    }
  };

  const idle = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 200));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => idle(warmPageNav));
  } else {
    idle(warmPageNav);
  }
})();
