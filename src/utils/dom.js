export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = val;
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else if (key.startsWith('on') && typeof val === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'dataset' && typeof val === 'object') {
        Object.assign(el.dataset, val);
      } else if (val !== false && val !== null && val !== undefined) {
        el.setAttribute(key, String(val));
      }
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el, children) {
  for (const child of children) {
    if (child == null || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else if (Array.isArray(child)) {
      appendChildren(el, child);
    }
  }
}

export function fragment(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const frag = document.createDocumentFragment();
  frag.append(...doc.body.childNodes);
  return frag;
}
