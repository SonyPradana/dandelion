import { describe, it, expect } from 'vitest';
import { normalize, score, highlightMatch, MAX_RESULTS } from '../../src/view/page/search.js';

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
