/**
 * Stupid-simple deep-link router for the config page.
 *
 * Canonical URL: index.html?tab=<tab>&section=<section>
 * - tab: one of VALID_TABS, defaults to 'profile'
 * - section: value of a [data-section] element, optional
 *
 * No hash fallback. Invalid values degrade to a sane default.
 */

export const VALID_TABS = [
  'profile',
  'form-skrining',
  'skrining',
  'register-form',
  'not-checked',
  'zen-mode',
  'produktifitas',
  'lainnya',
  'quota',
  'persetujuan',
];

export const DEFAULT_TAB = 'profile';

/**
 * Parse a query string into a route. Pure, no DOM.
 * @param {string} search - window.location.search (with or without leading '?')
 * @returns {{ tab: string, section: string | null }}
 */
export function parseRoute(search) {
  const params = new URLSearchParams(search);
  const tab = params.get('tab');
  if (!VALID_TABS.includes(tab)) {
    return { tab: DEFAULT_TAB, section: null };
  }
  const section = params.get('section');
  return { tab, section: section || null };
}

/**
 * Build a canonical query string for a route. Pure, no DOM.
 * @param {string} tab
 * @param {string | null} [section]
 * @returns {string} e.g. "?tab=skrining&section=skrining-answers"
 */
export function buildSearch(tab, section) {
  const params = new URLSearchParams();
  params.set('tab', tab);
  if (section) {
    params.set('section', section);
  }
  return `?${params.toString()}`;
}
