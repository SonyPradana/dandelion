import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  annotateHeadings,
  escapeHtml,
  hardenMarkdown,
  imageSizeFromBytes,
  injectAgreement,
  injectConfig,
  injectImageMeta,
  renderNav,
  renderPage,
  renderCopyMdScriptTag,
  renderPrefetchScriptTag,
  renderSpeculationRules,
  slugify,
  stripBuildMarkers,
} from '../../scripts/build-docs.js';

const parseSpeculationRules = (html) =>
  JSON.parse(html.replace(/^<script type="speculationrules">/, '').replace(/<\/script>$/, ''));

describe('build-docs', () => {
  describe('slugify', () => {
    it('converts text into url-safe anchors', () => {
      expect(slugify('Chrome, Brave, dan Edge')).toBe('chrome-brave-dan-edge');
      expect(slugify('Firefox (Android)')).toBe('firefox-android');
    });

    it('returns empty string for punctuation-only text', () => {
      expect(slugify('???')).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('escapes all special characters', () => {
      expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    });
  });

  describe('annotateHeadings', () => {
    it('injects ids and collects h2/h3 as toc entries', () => {
      const { html, headings } = annotateHeadings(
        '<h1>Judul</h1><h2>Desktop</h2><h3>Brave</h3><h3>Brave</h3><h4>Dalam</h4>',
      );
      expect(html).toContain('<h1 id="judul">Judul</h1>');
      expect(html).toContain('<h2 id="desktop">Desktop</h2>');
      expect(html).toContain('<h3 id="brave">Brave</h3>');
      expect(html).toContain('<h3 id="brave-1">Brave</h3>');
      expect(headings).toEqual([
        { level: 2, id: 'desktop', text: 'Desktop' },
        { level: 3, id: 'brave', text: 'Brave' },
        { level: 3, id: 'brave-1', text: 'Brave' },
      ]);
    });
  });

  describe('hardenMarkdown', () => {
    it('escapes raw html tags in prose', () => {
      expect(hardenMarkdown('<script>alert(1)</script>')).toBe(
        '&lt;script&gt;alert(1)&lt;/script&gt;',
      );
    });

    it('preserves fenced code blocks verbatim', () => {
      const md = 'text\n\n```html\n<div>x</div>\n```\n';
      expect(hardenMarkdown(md)).toBe(md);
    });

    it('preserves inline code spans verbatim', () => {
      const md = 'buka `chrome://extensions` di bilah alamat';
      expect(hardenMarkdown(md)).toBe(md);
    });

    it('escapes raw tags but keeps inline code spans on the same line', () => {
      expect(hardenMarkdown('pakai `<div>` bukan <div>')).toBe('pakai `<div>` bukan &lt;div&gt;');
    });
  });

  describe('stripBuildMarkers', () => {
    it('removes build placeholder comment lines', () => {
      const md =
        '# Judul\n\n<!-- agreement -->\n\nIsi\n\n<!-- config-section:not-checked-list -->\n\nAkhir\n';
      const out = stripBuildMarkers(md);
      expect(out).not.toContain('<!--');
      expect(out).toContain('# Judul');
      expect(out).toContain('Isi');
      expect(out).toContain('Akhir');
    });

    it('keeps unrelated comments and inline prose untouched', () => {
      const md = 'awal <!-- catatan biasa --> akhir\n';
      expect(stripBuildMarkers(md)).toBe(md);
    });
  });

  describe('imageSizeFromBytes', () => {
    it('reads lossy WebP frame dimensions', () => {
      const bytes = new Uint8Array(30);
      bytes.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0x2a, 0x57, 0x45, 0x42, 0x50]);
      bytes.set([0x56, 0x50, 0x38, 0x20], 12);
      bytes.set([0x9d, 0x01, 0x2a], 23);
      bytes[26] = 0xc0;
      bytes[27] = 0x03;
      bytes[28] = 0x1c;
      bytes[29] = 0x02;
      expect(imageSizeFromBytes(bytes)).toEqual({ width: 960, height: 540 });
    });

    it('reads extended WebP canvas dimensions (stored minus one)', () => {
      const bytes = new Uint8Array(30);
      bytes.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0x1a, 0x57, 0x45, 0x42, 0x50]);
      bytes.set([0x56, 0x50, 0x38, 0x58], 12);
      bytes.set([0x10, 0, 0, 0], 20);
      bytes.set([0xbf, 0x03, 0], 24);
      bytes.set([0x1b, 0x02, 0], 27);
      expect(imageSizeFromBytes(bytes)).toEqual({ width: 960, height: 540 });
    });

    it('reads PNG, JPEG, and GIF dimensions', () => {
      const png = new Uint8Array(24);
      png.set([0x89, 0x50, 0x4e, 0x47], 0);
      png.set([0, 0, 0, 0x0d], 8);
      png.set([0, 0, 0x03, 0xc0], 16);
      png.set([0, 0, 0x02, 0x1c], 20);
      expect(imageSizeFromBytes(png)).toEqual({ width: 960, height: 540 });

      const jpeg = new Uint8Array(29);
      jpeg.set([0xff, 0xd8, 0xff, 0xe0, 0, 16], 0);
      jpeg.set([0xff, 0xc0, 0, 17, 8], 20);
      jpeg.set([0x02, 0x1c], 25);
      jpeg.set([0x03, 0xc0], 27);
      expect(imageSizeFromBytes(jpeg)).toEqual({ width: 960, height: 540 });

      const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 100, 0, 50, 0]);
      expect(imageSizeFromBytes(gif)).toEqual({ width: 100, height: 50 });
    });

    it('returns null for unknown formats', () => {
      expect(imageSizeFromBytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))).toBeNull();
    });

    it('reads the generated doc assets from disk', () => {
      const assetsDir = join(process.cwd(), 'public', 'doc', 'v1', 'assets');
      const files = readdirSync(assetsDir).filter((file) => file.endsWith('.webp'));
      expect(files).toHaveLength(14);
      for (const file of files) {
        expect(imageSizeFromBytes(new Uint8Array(readFileSync(join(assetsDir, file))))).toEqual({
          width: 960,
          height: 540,
        });
      }
    });
  });

  describe('injectImageMeta', () => {
    it('adds dimensions and lazy attributes', () => {
      const html = '<p><img src="/doc/v1/assets/a.webp" alt="A" /></p>';
      expect(injectImageMeta(html, () => ({ width: 960, height: 540 }))).toBe(
        '<p><img src="/doc/v1/assets/a.webp" alt="A" width="960" height="540" loading="lazy" decoding="async" /></p>',
      );
    });

    it('keeps the tag without dimensions when size is unknown', () => {
      const html = '<p><img src="/doc/v1/assets/missing.webp" alt="M" /></p>';
      expect(injectImageMeta(html, () => null)).toBe(
        '<p><img src="/doc/v1/assets/missing.webp" alt="M" loading="lazy" decoding="async" /></p>',
      );
    });

    it('rejects images without alt text', () => {
      expect(() => injectImageMeta('<p><img src="/a.webp" alt="" /></p>', () => null)).toThrow(
        /alt text/,
      );
    });
  });

  describe('injectAgreement', () => {
    it('injects the shared agreement copy and removes the marker', () => {
      const html = injectAgreement('<p><!-- agreement --></p>');
      expect(html).toContain('PERSETUJUAN PENGGUNAAN');
      expect(html).not.toContain('agreement -->');
    });
  });

  describe('injectConfig', () => {
    it('injects labelled entries from the settings search index', () => {
      const html = injectConfig('<p><!-- config-section:not-checked-list --></p>');
      expect(html).toContain('<ul>');
      expect(html).toContain('</ul>');
      expect(html).toContain('<strong>');
      expect(html).not.toContain('config-section');
    });

    it('throws on an unknown config section id', () => {
      expect(() => injectConfig('<!-- config-section:does-not-exist -->')).toThrow(
        /Unknown config section/,
      );
    });
  });

  describe('renderNav', () => {
    it('groups entries by section in first-appearance order', () => {
      const pages = [
        { slug: 'installation', title: 'Instalasi', section: 'Dasar' },
        { slug: 'token', title: 'Token', section: 'Token' },
        { slug: 'uninstall', title: 'Uninstalasi', section: 'Dasar' },
      ];
      const html = renderNav('v1', pages, 'token');
      const dasarPos = html.indexOf('<p class="nav-label">Dasar</p>');
      const tokenPos = html.indexOf('<p class="nav-label">Token</p>');
      expect(dasarPos).toBeGreaterThanOrEqual(0);
      expect(tokenPos).toBeGreaterThan(dasarPos);
      expect(html.match(/nav-label/g)).toHaveLength(2);
      expect(html).toContain('<a class="nav-link" href="/doc/v1/installation">Instalasi</a>');
      expect(html).toContain('<a class="nav-link is-active" href="/doc/v1/token">Token</a>');
    });

    it('renders without section labels when no sections are set', () => {
      const html = renderNav('v1', [{ slug: 'installation', title: 'Instalasi' }], 'installation');
      expect(html).not.toContain('nav-label');
      expect(html).toContain('is-active');
    });

    it('nests subsection pages under one section label', () => {
      const pages = [
        { slug: 'config-basics', title: 'Dasar', section: 'Config' },
        { slug: 'config-profile', title: 'Profil', section: 'Config', subsection: 'Lanjutan' },
        {
          slug: 'config-quota',
          title: 'Batas Pemakaian',
          section: 'Config',
          subsection: 'Lanjutan',
        },
      ];
      const html = renderNav('v1', pages, 'config-profile');
      expect(html.match(/nav-label/g)).toHaveLength(1);
      expect(html).toContain('<p class="nav-sublabel">Lanjutan</p>');
      expect(html).toContain('nav-link" href="/doc/v1/config-basics"');
      expect(html).toContain('nav-link is-sub is-active" href="/doc/v1/config-profile"');
    });
  });

  describe('renderSpeculationRules', () => {
    const pages = [
      { slug: 'installation', title: 'Instalasi' },
      { slug: 'uninstall', title: 'Uninstalasi' },
      { slug: 'update', title: 'Pembaruan' },
    ];

    it('prefetches next/prev at load and other doc links on hover', () => {
      const html = renderSpeculationRules('v1', pages, 1);
      const rules = parseSpeculationRules(html);
      expect(rules.prefetch[0]).toEqual({ urls: ['/doc/v1/installation', '/doc/v1/update'] });
      expect(rules.prefetch[1]).toEqual({
        source: 'document',
        where: {
          and: [
            { href_matches: '/doc/v1/*' },
            { not: { selector_matches: '.nav-link.is-active' } },
            { not: { selector_matches: '.toc a' } },
          ],
        },
        eagerness: 'moderate',
      });
    });

    it('warms only the next page on the first page', () => {
      const rules = parseSpeculationRules(renderSpeculationRules('v1', pages, 0));
      expect(rules.prefetch[0]).toEqual({ urls: ['/doc/v1/uninstall'] });
    });

    it('warms only the previous page on the last page', () => {
      const rules = parseSpeculationRules(renderSpeculationRules('v1', pages, 2));
      expect(rules.prefetch[0]).toEqual({ urls: ['/doc/v1/uninstall'] });
    });
  });

  describe('renderPrefetchScriptTag', () => {
    it('loads the fallback script deferred', () => {
      const tag = renderPrefetchScriptTag();
      expect(tag).toContain('src="/doc/prefetch.js"');
      expect(tag).toContain('defer');
    });
  });

  describe('renderCopyMdScriptTag', () => {
    it('loads the copy-as-Markdown script deferred', () => {
      const tag = renderCopyMdScriptTag();
      expect(tag).toContain('src="/doc/copy-md.js"');
      expect(tag).toContain('defer');
    });
  });

  describe('renderPage', () => {
    it('wires the speculation rules, prefetch fallback, nav, and content', () => {
      const pages = [
        { slug: 'a', title: 'A', section: 'Dasar' },
        { slug: 'b', title: 'B', section: 'Dasar' },
      ];
      const html = renderPage({
        version: 'v1',
        pages,
        index: 0,
        content: '<p>hi</p>',
        headings: [],
      });
      expect(html).toContain('<script type="speculationrules">');
      expect(html).toContain('src="/doc/prefetch.js"');
      expect(html).toContain('src="/doc/copy-md.js"');
      expect(html).toContain('href="/doc/v1/b"');
      expect(html).toContain('class="page-nav"');
      expect(html).toContain('<p>hi</p>');
    });

    it('renders the copy-as-Markdown button before the version badge', () => {
      const pages = [{ slug: 'a', title: 'A' }];
      const html = renderPage({ version: 'v1', pages, index: 0, content: '', headings: [] });
      const buttonPos = html.indexOf('data-copy-md');
      const badgePos = html.indexOf('<span class="badge">');
      expect(buttonPos).toBeGreaterThanOrEqual(0);
      expect(badgePos).toBeGreaterThan(buttonPos);
      expect(html).toContain('href="/doc/v1/a.md"');
      expect(html).toContain('title="Salin sebagai Markdown"');
      expect(html).toContain('aria-label="Salin sebagai Markdown"');
    });
  });
});
