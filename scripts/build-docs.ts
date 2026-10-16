// Generates static HTML documentation under public/doc/<version>/ from markdown
// sources in docs/<version>/ using the built-in Bun.markdown renderer (no deps).
//
// Usage: bun scripts/build-docs.ts   (or: pnpm build:docs)
//
// Each version directory holds:
//   manifest.json        ordered page list → sidebar nav + prev/next links
//   <slug>.md            page source (rules: no raw HTML, see hardenMarkdown)
//   (images live directly in public/doc/<version>/assets/)

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AGREEMENT_SECTIONS_HTML } from '../src/agreement-text.js';
import { SEARCH_INDEX } from '../src/view/page/search-index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = join(ROOT, 'docs');
const PUBLIC_DOC_DIR = join(ROOT, 'public', 'doc');

interface PageMeta {
  slug: string;
  title: string;
  section?: string;
  subsection?: string;
}

interface Manifest {
  pages: PageMeta[];
}

interface Heading {
  level: number;
  id: string;
  text: string;
}

const MASK_14BIT = (1 << 14) - 1;

interface ImageSize {
  width: number;
  height: number;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Bun.markdown passes raw HTML through untouched. Docs sources own their
// markup via markdown only, so escape any stray tags outside fenced code
// blocks and inline code spans (the renderer escapes those itself).
export function hardenMarkdown(md: string): string {
  let fenced = false;
  return md
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;
      return line.replace(/(`[^`]*`)|(<\/?[a-zA-Z][^<>]*>)/g, (match, code: string | undefined) =>
        code === undefined ? match.replace(/</g, '&lt;').replace(/>/g, '&gt;') : code,
      );
    })
    .join('\n');
}

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Reads intrinsic dimensions from image headers. Supports WebP (VP8/VP8L/VP8X),
// PNG, JPEG, and GIF — enough for docs assets; returns null when unknown.
export function imageSizeFromBytes(bytes: Uint8Array): ImageSize | null {
  const be16 = (offset: number) => ((bytes[offset] << 8) | bytes[offset + 1]) >>> 0;
  const be32 = (offset: number) =>
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0;
  const le16 = (offset: number) => (bytes[offset] | (bytes[offset + 1] << 8)) >>> 0;
  const le24 = (offset: number) =>
    (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)) >>> 0;

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { width: be32(16), height: be32(20) };
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { width: le16(6), height: le16(8) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 <= bytes.length) {
      if (bytes[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = bytes[i + 1];
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return { height: be16(i + 5), width: be16(i + 7) };
      }
      const standalone = marker === 0x01 || marker === 0xff || (marker >= 0xd0 && marker <= 0xd7);
      i += standalone ? 2 : 2 + be16(i + 2);
    }
    return null;
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) {
    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunk === 'VP8 ') {
      // lossy frame: 14-bit dimension + 2 scale bits, stored as the value itself
      return {
        width: (bytes[26] | (bytes[27] << 8)) & MASK_14BIT,
        height: (bytes[28] | (bytes[29] << 8)) & MASK_14BIT,
      };
    }
    if (chunk === 'VP8L') {
      // lossless frame: 14-bit dimensions stored minus one, then alpha/version bits
      const packed = be32(21);
      return { width: (packed & MASK_14BIT) + 1, height: ((packed >>> 14) & MASK_14BIT) + 1 };
    }
    if (chunk === 'VP8X') {
      // extended: 24-bit canvas dimensions stored minus one
      return { width: le24(24) + 1, height: le24(27) + 1 };
    }
  }
  return null;
}

// Rewrites rendered <img> tags: alt text is mandatory, dimensions and lazy
// loading are injected. Bun.markdown renders images as <img src="…" alt="…" />.
export function injectImageMeta(
  html: string,
  lookupSize: (src: string) => ImageSize | null,
): string {
  return html.replace(/<img ([^>]*?)\/>/g, (_match, attrs: string) => {
    const src = attrs.match(/src="([^"]*)"/)?.[1];
    const alt = attrs.match(/alt="([^"]*)"/)?.[1];
    if (src === undefined) throw new Error('img tag without src attribute');
    if (alt === undefined || alt === '') throw new Error(`img without alt text: ${src}`);
    const size = lookupSize(src);
    const dims = size === null ? '' : ` width="${size.width}" height="${size.height}"`;
    return `<img src="${src}" alt="${alt}"${dims} loading="lazy" decoding="async" />`;
  });
}

// Injects ids into every heading and collects h2/h3 as table-of-contents entries.
export function annotateHeadings(html: string): { html: string; headings: Heading[] } {
  const used = new Map<string, number>();
  const headings: Heading[] = [];
  const out = html.replace(/<h([1-6])>(.*?)<\/h\1>/g, (_match, rawLevel: string, inner: string) => {
    const level = Number(rawLevel);
    const text = inner.replace(/<[^>]+>/g, '');
    let id = slugify(text) || 'section';
    const seen = used.get(id) ?? 0;
    used.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen}`;
    if (level >= 2 && level <= 3) headings.push({ level, id, text });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, headings };
}

// Groups nav entries by section, then by subsection (both first-appearance
// order) so the left panel shows visual groups like "Config → Dasar/Lanjutan".
export function renderNav(version: string, pages: PageMeta[], currentSlug: string): string {
  const sections = new Map<string, PageMeta[]>();
  for (const page of pages) {
    const section = page.section ?? '';
    const group = sections.get(section);
    if (group) group.push(page);
    else sections.set(section, [page]);
  }
  const parts: string[] = [];
  for (const [section, sectionPages] of sections) {
    if (section !== '') parts.push(`<p class="nav-label">${escapeHtml(section)}</p>`);
    const subsections = new Map<string, PageMeta[]>();
    for (const page of sectionPages) {
      const subsection = page.subsection ?? '';
      const group = subsections.get(subsection);
      if (group) group.push(page);
      else subsections.set(subsection, [page]);
    }
    for (const [subsection, subPages] of subsections) {
      if (subsection !== '') parts.push(`<p class="nav-sublabel">${escapeHtml(subsection)}</p>`);
      for (const page of subPages) {
        const nested = subsection !== '' ? ' is-sub' : '';
        parts.push(
          `<a class="nav-link${nested}${page.slug === currentSlug ? ' is-active' : ''}" href="/doc/${version}/${page.slug}">${escapeHtml(page.title)}</a>`,
        );
      }
    }
  }
  return parts.join('\n      ');
}

function renderToc(headings: Heading[]): string {
  const items = headings
    .map(
      (heading) =>
        `<li class="toc-h${heading.level}"><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`,
    )
    .join('\n    ');
  if (items === '') return '';
  return `<aside class="toc">
    <p class="toc-title">Di halaman ini</p>
    <ul>
    ${items}
    </ul>
  </aside>`;
}

function renderPageNav(version: string, pages: PageMeta[], index: number): string {
  const prev = index > 0 ? pages[index - 1] : null;
  const next = index < pages.length - 1 ? pages[index + 1] : null;
  const prevHtml = prev
    ? `<a class="btn btn-outline" href="/doc/${version}/${prev.slug}">&larr; ${escapeHtml(prev.title)}</a>`
    : `<span class="btn btn-outline is-disabled" aria-disabled="true">&larr; ${escapeHtml(pages[0].title)}</span>`;
  const nextHtml = next
    ? `<a class="btn btn-outline" href="/doc/${version}/${next.slug}">${escapeHtml(next.title)} &rarr;</a>`
    : `<span class="btn btn-outline is-disabled" aria-disabled="true">${escapeHtml(pages.at(-1)?.title ?? '')} &rarr;</span>`;
  return `<nav class="page-nav">
    ${prevHtml}
    ${nextHtml}
  </nav>`;
}

// Native Speculation Rules (Chromium/WebKit with support):
//   1. list rule     → next/prev pages are prefetched as soon as this page
//                      loads (eagerness defaults to "immediate").
//   2. document rule → every other same-version doc link is prefetched when
//                      hovered ~200ms (desktop) or via viewport heuristics
//                      (mobile). Active nav link and in-page TOC anchors are
//                      excluded; browsers without support simply ignore the
//                      block and /doc/prefetch.js covers them instead.
export function renderSpeculationRules(version: string, pages: PageMeta[], index: number): string {
  const rules: Record<string, unknown>[] = [];
  const neighbors = [pages[index - 1], pages[index + 1]].filter(
    (page): page is PageMeta => page !== undefined,
  );
  if (neighbors.length > 0) {
    rules.push({ urls: neighbors.map((page) => `/doc/${version}/${page.slug}`) });
  }
  rules.push({
    source: 'document',
    where: {
      and: [
        { href_matches: `/doc/${version}/*` },
        { not: { selector_matches: '.nav-link.is-active' } },
        { not: { selector_matches: '.toc a' } },
      ],
    },
    eagerness: 'moderate',
  });
  return `<script type="speculationrules">${JSON.stringify({ prefetch: rules })}</script>`;
}

export function renderPrefetchScriptTag(): string {
  return '<script src="/doc/prefetch.js" defer></script>';
}

function renderPage(opts: {
  version: string;
  pages: PageMeta[];
  index: number;
  content: string;
  headings: Heading[];
}): string {
  const { version, pages, index, content, headings } = opts;
  const page = pages[index];
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(page.title)} — Dokumentasi Dandelion</title>
    <link rel="stylesheet" href="/doc/doc.css" />
    ${renderSpeculationRules(version, pages, index)}
  </head>
  <body>
    <header class="topbar">
      <div class="topbar-inner">
        <a class="topbar-brand" href="/">Dandelion</a>
        <div class="topbar-meta">
          <span class="badge">${version}</span>
          <label for="nav-toggle" class="nav-toggle-label">Menu</label>
        </div>
      </div>
    </header>
    <input type="checkbox" id="nav-toggle" class="nav-toggle" aria-label="Menu navigasi" />
    <div class="layout">
      <aside class="sidebar">
        <nav class="nav">
      ${renderNav(version, pages, page.slug)}
        </nav>
      </aside>
      <main class="content">
        <article class="prose">
${content}
        </article>
${renderPageNav(version, pages, index)}
      </main>
      ${renderToc(headings)}
    </div>
    ${renderPrefetchScriptTag()}
  </body>
</html>
`;
}

// Replaces the <!-- agreement --> marker with the shared copy from
// src/agreement-text.js — single source of truth with the in-app agreement.
export function injectAgreement(html: string): string {
  return html.replace(/<!--\s*agreement\s*-->/g, AGREEMENT_SECTIONS_HTML);
}

// Replaces <!-- config-section:<id> --> markers with the entry list (label +
// description) from src/view/page/search-index.js — single source of truth
// with the settings search index. Unknown ids fail the build on purpose.
export function injectConfig(html: string): string {
  return html.replace(/<!--\s*config-section:([\w-]+)\s*-->/g, (_match: string, id: string) => {
    const entries = SEARCH_INDEX.filter((entry) => entry.section === id);
    if (entries.length === 0) throw new Error(`Unknown config section: ${id}`);
    const items = entries
      .map(
        (entry) =>
          `<li><strong>${escapeHtml(entry.label)}</strong> — ${escapeHtml(entry.description)}</li>`,
      )
      .join('');
    return `<ul>${items}</ul>`;
  });
}

function buildVersion(version: string): string[] {
  const srcDir = join(DOCS_DIR, version);
  const manifestPath = join(srcDir, 'manifest.json');
  if (!existsSync(manifestPath)) throw new Error(`Missing manifest: ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
  if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) {
    throw new Error(`No pages in ${manifestPath}`);
  }

  const outDir = join(PUBLIC_DOC_DIR, version);
  const assetsDir = join(outDir, 'assets');
  mkdirSync(assetsDir, { recursive: true });

  const lookupSize = (src: string): ImageSize | null => {
    if (!src.startsWith(`/doc/${version}/assets/`)) return null;
    const name = basename(src);
    if (name !== src.slice(src.lastIndexOf('/') + 1) || !/^[\w.-]+$/.test(name)) return null;
    const file = join(assetsDir, name);
    if (!existsSync(file)) return null;
    try {
      return imageSizeFromBytes(new Uint8Array(readFileSync(file)));
    } catch {
      return null;
    }
  };

  const slugs: string[] = [];
  manifest.pages.forEach((page, index) => {
    const mdPath = join(srcDir, `${page.slug}.md`);
    if (!existsSync(mdPath)) throw new Error(`Missing source: ${mdPath}`);
    const rendered = injectConfig(
      injectAgreement(Bun.markdown.html(hardenMarkdown(readFileSync(mdPath, 'utf8')))),
    );
    const { html, headings } = annotateHeadings(rendered);
    const html5 = renderPage({
      version,
      pages: manifest.pages,
      index,
      content: injectImageMeta(html, lookupSize),
      headings,
    });
    writeFileSync(join(outDir, `${page.slug}.html`), html5);
    // The first page doubles as the version landing page (/doc/<version>/).
    if (index === 0) writeFileSync(join(outDir, 'index.html'), html5);
    slugs.push(page.slug);
  });
  return slugs;
}

// Doc version directories (docs/v1, docs/v2, …) sorted numerically.
export function listDocVersions(): string[] {
  if (!existsSync(DOCS_DIR)) return [];
  return readdirSync(DOCS_DIR)
    .filter((name) => /^v\d+$/.test(name))
    .toSorted((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

function main(): void {
  const versions = listDocVersions();
  if (versions.length === 0) throw new Error('No doc versions found in docs/');

  console.log('\n  Dandelion Docs');
  for (const version of versions) {
    const slugs = buildVersion(version);
    console.log(`  ${version}: ${slugs.join(', ')}`);
    console.log(`    -> public/doc/${version}/ (${slugs.length + 1} files)`);
  }
  console.log('');
}

if (import.meta.main) main();
