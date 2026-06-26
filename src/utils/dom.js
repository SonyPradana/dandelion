/**
 * Creates a DOM element programmatically.
 *
 * Use when:
 * - You need event listeners (onClick, onChange, etc.)
 * - Content comes from dynamic data (user input, variables)
 * - You need specific DOM properties (value, disabled, className)
 *
 * @param {string} tag - HTML tag name (div, span, button, etc.)
 * @param {Object|null} attrs - Element attributes/properties
 *   className: string    → sets class attribute
 *   style: object|string → style object ({display:'flex'}) or cssText
 *   value: string        → el.value (for input/textarea)
 *   textContent: string  → el.textContent
 *   disabled: boolean    → el.disabled
 *   onClick, onMouseenter, etc. → event listener
 *   dataset: object      → el.dataset
 *   other values         → setAttribute
 * @param {...(string|number|Node|Array)} children - Child elements or text
 * @returns {HTMLElement}
 *
 * @example
 * h('button', { className: 'btn', onClick: () => alert('hi') }, 'Click me')
 * h('div', { style: { display: 'flex', gap: '4px' } },
 *   h('span', null, 'label'),
 * )
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = val;
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else if (key === 'value') {
        el.value = val;
      } else if (key === 'textContent') {
        el.textContent = val;
      } else if (key === 'disabled') {
        el.disabled = val !== false && val !== null && val !== undefined;
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

/**
 * Converts a static HTML string into a DocumentFragment.
 *
 * Use when: the HTML content comes from a constant export
 * (e.g. AGREEMENT_SECTIONS_HTML) — more concise than html``
 *
 * Internally uses DOMParser, NOT innerHTML. Safe from web-ext lint.
 *
 * @param {string} html - Static HTML string
 * @returns {DocumentFragment}
 *
 * @example
 * container.appendChild(fragment(AGREEMENT_SECTIONS_HTML))
 */
export function fragment(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const frag = document.createDocumentFragment();
  frag.append(...doc.body.childNodes);
  return frag;
}

/**
 * Tagged template literal — parses an HTML string into a DocumentFragment.
 *
 * Use when:
 * - The markup is mostly static (headers, labels, fixed structure)
 * - You want high readability with familiar HTML syntax
 * - You only need simple text interpolation (${name})
 *
 * Do NOT use for:
 * - Event listeners (onClick in string HTML won't work)
 * - Unsanitized user input
 *
 * Internally uses DOMParser, NOT innerHTML. Safe from web-ext lint.
 *
 * @param {string[]} strings - Template literal strings
 * @param {...*} values - Interpolated values
 * @returns {DocumentFragment}
 *
 * @example
 * header.append(html`<div class="title">Settings</div>`)
 * container.append(html`<span>${userName}</span>`)
 *
 * // Combined with h():
 * container.append(
 *   h('button', { onClick: handleClick }, 'Save'),
 *   html`<span class="hint">Press Enter to save</span>`,
 * )
 */
export function html(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i] + (values[i] !== undefined ? String(values[i]) : '');
  }
  const doc = new DOMParser().parseFromString(result, 'text/html');
  const frag = document.createDocumentFragment();
  frag.append(...doc.body.childNodes);
  return frag;
}
