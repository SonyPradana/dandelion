import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SEARCH_INDEX } from '../../src/view/page/search-index.js';
import { VALID_TABS } from '../../src/view/page/router.js';

const html = readFileSync('src/view/page/index.html', 'utf8');
const domSections = new Set([...html.matchAll(/data-section="([^"]+)"/g)].map((match) => match[1]));
const domPanes = new Set([...html.matchAll(/id="(tab-[a-z-]+)"/g)].map((match) => match[1]));

describe('search index conformance', () => {
  it('has non-empty label, keywords, and description on every entry', () => {
    for (const entry of SEARCH_INDEX) {
      expect(entry.label.trim().length, `${entry.tab}/${entry.section}: label`).toBeGreaterThan(0);
      expect(entry.keywords.length, `${entry.tab}/${entry.section}: keywords`).toBeGreaterThan(0);
      expect(
        entry.description.trim().length,
        `${entry.tab}/${entry.section}: description`,
      ).toBeGreaterThan(0);
    }
  });

  it('only references valid tabs with existing panes', () => {
    for (const entry of SEARCH_INDEX) {
      expect(VALID_TABS, `${entry.label}: tab`).toContain(entry.tab);
      expect(domPanes, `${entry.tab}: pane`).toContain(`tab-${entry.tab}`);
    }
  });

  it('has no duplicate sections', () => {
    const sections = SEARCH_INDEX.map((entry) => entry.section).filter(Boolean);
    expect(new Set(sections).size).toBe(sections.length);
  });

  it('covers every [data-section] in index.html', () => {
    const indexed = new Set(SEARCH_INDEX.map((entry) => entry.section).filter(Boolean));
    for (const section of domSections) {
      expect(indexed, `missing index entry: ${section}`).toContain(section);
    }
  });

  it('references no section missing from index.html', () => {
    for (const entry of SEARCH_INDEX) {
      if (entry.section === null) continue;
      expect(domSections, `missing [data-section]: ${entry.section}`).toContain(entry.section);
    }
  });
});
