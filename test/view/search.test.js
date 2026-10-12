import { describe, it, expect } from 'vitest';
import {
  normalize,
  score,
  highlightMatch,
  initSearch,
  MAX_RESULTS,
} from '../../src/view/page/search.js';

function entry(overrides) {
  return {
    tab: 'skrining',
    section: 'skrining-answers',
    label: 'Jawaban Radio',
    tabLabel: 'Skrining',
    keywords: ['jawaban', 'radio'],
    description: 'Jawaban radio per ID',
    ...overrides,
  };
}

describe('normalize', () => {
  it('lowercases, trims, and collapses whitespace', () => {
    expect(normalize('  Jawaban   RADIO ')).toBe('jawaban radio');
  });

  it('handles empty input', () => {
    expect(normalize('')).toBe('');
    expect(normalize(null)).toBe('');
  });
});

describe('score', () => {
  const index = [
    entry({}),
    entry({
      tab: 'quota',
      section: null,
      label: 'Batas Pemakaian',
      tabLabel: 'Batas Pemakaian',
      keywords: ['token', 'limit'],
      description: 'Token dan sisa',
    }),
    entry({
      tab: 'lainnya',
      section: 'lainnya-posisi-panel',
      label: 'Posisi Panel',
      tabLabel: 'Lainnya',
      keywords: ['posisi', 'panel'],
      description: 'Posisi panel di layar',
    }),
  ];

  it('returns every entry on empty query (browse mode)', () => {
    expect(score('', index)).toHaveLength(3);
    expect(score('   ', index)).toHaveLength(3);
  });

  it('matches label substring case-insensitively', () => {
    const results = score('JAWABAN', index);
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe('Jawaban Radio');
  });

  it('matches keyword aliases the label does not contain', () => {
    const results = score('token', index);
    expect(results).toHaveLength(1);
    expect(results[0].tab).toBe('quota');
  });

  it('requires every token to match (AND)', () => {
    expect(score('jawaban radio', index)).toHaveLength(1);
    expect(score('jawaban token', index)).toHaveLength(0);
  });

  it('ranks label matches above keyword matches', () => {
    const radioIndex = [
      entry({ label: 'Daftar Sesuatu', keywords: ['radio'] }),
      entry({ label: 'Radio Utama', keywords: ['utama'] }),
    ];
    const results = score('radio', radioIndex);
    expect(results[0].label).toBe('Radio Utama');
  });

  it('caps results at MAX_RESULTS', () => {
    const big = Array.from({ length: MAX_RESULTS + 5 }, (_, i) =>
      entry({ section: `section-${i}`, label: `Item Radio ${i}` }),
    );
    expect(score('radio', big)).toHaveLength(MAX_RESULTS);
  });
});

describe('highlightMatch', () => {
  it('splits label around the first token occurrence', () => {
    expect(highlightMatch('Jawaban Radio', 'radio')).toEqual({
      before: 'Jawaban ',
      match: 'Radio',
      after: '',
    });
  });

  it('keeps original casing in the match part', () => {
    expect(highlightMatch('URL Halaman Skrining', 'halaman skrining')).toEqual({
      before: 'URL ',
      match: 'Halaman',
      after: ' Skrining',
    });
  });

  it('returns the whole label when nothing matches', () => {
    expect(highlightMatch('Jawaban Radio', 'token')).toEqual({
      before: 'Jawaban Radio',
      match: '',
      after: '',
    });
  });
});

describe('initSearch empty state', () => {
  function setup() {
    document.body.innerHTML = `
      <div class="config-search">
        <input id="test-search-input" />
        <ul id="test-search-list" class="hidden"></ul>
        <div id="test-search-status" role="status"></div>
      </div>`;
    const navigated = [];
    initSearch({
      inputId: 'test-search-input',
      listId: 'test-search-list',
      statusId: 'test-search-status',
      index: [entry({})],
      onNavigate: (tab, section) => navigated.push({ tab, section }),
    });
    return navigated;
  }

  function type(text) {
    const input = document.getElementById('test-search-input');
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return input;
  }

  it('announces no-results in the live region and keeps the listbox hidden', () => {
    setup();
    const input = type('zzz-tidak-ada');
    expect(document.getElementById('test-search-status').textContent).toContain('Tidak ditemukan');
    expect(document.getElementById('test-search-list').classList.contains('hidden')).toBe(true);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(
      document.getElementById('test-search-list').querySelectorAll('[role="option"]'),
    ).toHaveLength(0);
  });

  it('clears the live region and opens the listbox when results exist', () => {
    setup();
    type('zzz-tidak-ada');
    const input = type('radio');
    expect(document.getElementById('test-search-status').textContent).toBe('');
    expect(document.getElementById('test-search-list').classList.contains('hidden')).toBe(false);
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('navigates on Enter', () => {
    const navigated = setup();
    type('radio');
    document
      .getElementById('test-search-input')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(navigated).toEqual([{ tab: 'skrining', section: 'skrining-answers' }]);
  });
});
