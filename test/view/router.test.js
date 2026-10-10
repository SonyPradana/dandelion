import { describe, it, expect } from 'vitest';
import { parseRoute, buildSearch, VALID_TABS, DEFAULT_TAB } from '../../src/view/page/router.js';

describe('parseRoute', () => {
  it('parses tab and section', () => {
    expect(parseRoute('?tab=skrining&section=skrining-answers')).toEqual({
      tab: 'skrining',
      section: 'skrining-answers',
    });
  });

  it('parses tab without section', () => {
    expect(parseRoute('?tab=profile')).toEqual({ tab: 'profile', section: null });
  });

  it('defaults to profile on empty search', () => {
    expect(parseRoute('')).toEqual({ tab: DEFAULT_TAB, section: null });
  });

  it('defaults to profile on invalid tab and drops section', () => {
    expect(parseRoute('?tab=nope&section=x')).toEqual({ tab: DEFAULT_TAB, section: null });
  });

  it('drops section when tab is missing', () => {
    expect(parseRoute('?section=skrining-answers')).toEqual({ tab: DEFAULT_TAB, section: null });
  });
});

describe('buildSearch', () => {
  it('builds tab-only search', () => {
    expect(buildSearch('profile')).toBe('?tab=profile');
  });

  it('builds tab+section search', () => {
    expect(buildSearch('skrining', 'skrining-answers')).toBe(
      '?tab=skrining&section=skrining-answers',
    );
  });

  it('round-trips through parseRoute', () => {
    for (const tab of VALID_TABS) {
      expect(parseRoute(buildSearch(tab))).toEqual({ tab, section: null });
    }
    expect(parseRoute(buildSearch('skrining', 'skrining-answers'))).toEqual({
      tab: 'skrining',
      section: 'skrining-answers',
    });
  });
});
