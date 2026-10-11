/**
 * Stupid-simple config search: pure match functions + input/dropdown wiring.
 *
 * Matching: every query token must appear as a substring in one of the
 * entry fields (AND between tokens, OR between fields). Rank tiers:
 * label-prefix (3) > label-substring (2) > keyword (1) > tab/description (0).
 * No debounce, no fuzzy matching — the index is tiny and local.
 */

export const MAX_RESULTS = 8;

/**
 * Normalize untrusted input at the boundary. Pure.
 * @param {string} text
 * @returns {string}
 */
export function normalize(text) {
  return (text || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Score an index against a query. Pure, no DOM.
 * Empty query returns every entry (browse mode).
 * @param {string} query
 * @param {Array} index - SEARCH_INDEX entries
 * @returns {Array} matched entries, best first, capped at MAX_RESULTS
 */
export function score(query, index) {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) {
    return index.slice();
  }
  const scored = [];
  for (const entry of index) {
    const label = normalize(entry.label);
    const keywords = (entry.keywords || []).map(normalize);
    const tab = normalize(entry.tabLabel);
    const description = normalize(entry.description);
    let rank = -1;
    let matched = true;
    for (const token of tokens) {
      let tier = -1;
      if (label.startsWith(token)) {
        tier = 3;
      } else if (label.includes(token)) {
        tier = 2;
      } else if (keywords.some((keyword) => keyword.includes(token))) {
        tier = 1;
      } else if (tab.includes(token) || description.includes(token)) {
        tier = 0;
      } else {
        matched = false;
        break;
      }
      rank = rank === -1 ? tier : Math.min(rank, tier);
    }
    if (matched) {
      scored.push({ entry, rank });
    }
  }
  scored.sort((a, b) => b.rank - a.rank);
  return scored.slice(0, MAX_RESULTS).map((item) => item.entry);
}

/**
 * Split a label around the first token occurrence for <mark> highlight.
 * Returns plain strings; the caller builds text nodes (XSS-safe). Pure.
 * @param {string} label
 * @param {string} query
 * @returns {{ before: string, match: string, after: string }}
 */
export function highlightMatch(label, query) {
  const tokens = normalize(query).split(' ').filter(Boolean);
  let first = -1;
  let length = 0;
  const lower = label.toLowerCase();
  for (const token of tokens) {
    const at = lower.indexOf(token);
    if (at !== -1 && (first === -1 || at < first)) {
      first = at;
      length = token.length;
    }
  }
  if (first === -1) {
    return { before: label, match: '', after: '' };
  }
  return {
    before: label.slice(0, first),
    match: label.slice(first, first + length),
    after: label.slice(first + length),
  };
}

/**
 * Wire a search input + dropdown list to an index. DOM only, no matching logic.
 * @param {object} options
 * @param {string} options.inputId
 * @param {string} options.listId
 * @param {Array} options.index
 * @param {(tab: string, section: string | null) => void} options.onNavigate
 */
export function initSearch({ inputId, listId, index, onNavigate }) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!input || !list) {
    return;
  }
  let results = [];
  let active = -1;

  function close() {
    list.classList.add('hidden');
    input.setAttribute('aria-expanded', 'false');
    active = -1;
  }

  function open() {
    list.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
  }

  function paintActive() {
    list.querySelectorAll('[role="option"]').forEach((item, position) => {
      const selected = position === active;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    input.setAttribute('aria-activedescendant', active >= 0 ? `${listId}-item-${active}` : '');
  }

  function select(position) {
    const entry = results[position];
    if (!entry) {
      return;
    }
    onNavigate(entry.tab, entry.section);
    close();
    input.blur();
  }

  function render(query) {
    results = score(query, index);
    active = results.length > 0 ? 0 : -1;
    list.replaceChildren();
    if (results.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'config-search-empty';
      empty.textContent = 'Tidak ditemukan. Coba kata kunci lain.';
      list.appendChild(empty);
    } else {
      results.forEach((entry, position) => {
        const item = document.createElement('li');
        item.setAttribute('role', 'option');
        item.id = `${listId}-item-${position}`;
        const title = document.createElement('div');
        title.className = 'config-search-title';
        const parts = highlightMatch(entry.label, query);
        title.appendChild(document.createTextNode(parts.before));
        if (parts.match) {
          const mark = document.createElement('mark');
          mark.textContent = parts.match;
          title.appendChild(mark);
          title.appendChild(document.createTextNode(parts.after));
        }
        const sub = document.createElement('div');
        sub.className = 'config-search-sub';
        sub.textContent = `${entry.tabLabel} · ${entry.description}`;
        item.append(title, sub);
        item.addEventListener('mousedown', (event) => {
          event.preventDefault();
          select(position);
        });
        list.appendChild(item);
      });
    }
    paintActive();
    open();
  }

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('focus', () => render(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length === 0) {
        return;
      }
      active = (active + 1) % results.length;
      paintActive();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) {
        return;
      }
      active = (active - 1 + results.length) % results.length;
      paintActive();
    } else if (event.key === 'Enter') {
      if (active >= 0) {
        event.preventDefault();
        select(active);
      }
    } else if (event.key === 'Escape') {
      close();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.config-search')) {
      close();
    }
  });
}
