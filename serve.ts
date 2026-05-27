import { createHash } from 'node:crypto';
import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

// --- types ---

interface Artifact {
  fileName: string;
  browser: string;
  version: string;
  url: string;
  hash: string;
  size: number;
}

// --- config ---

const PORT = parseInt(process.env.PORT || '3000', 10);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ROOT = import.meta.dir!;
const ARTIFACTS_DIR = join(ROOT, 'artifacts');
const PUBLIC_DIR = join(ROOT, 'public');

const ARTIFACT_RE = /^dandelion-(chrome|firefox)-v(\d+\.\d+\.\d+)(?:-signed)?\.(crx|xpi)$/;

const CONTENT_TYPES: Record<string, string> = {
  '.crx': 'application/x-chrome-extension',
  '.xpi': 'application/x-xpinstall',
};

// --- helpers ---

function cmpVer(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function chromeExtensionId(): string | null {
  const key = process.env.CHROME_EXTENSION_KEY;
  if (!key) return null;
  const bytes = Buffer.from(key, 'base64');
  const hash = createHash('sha256').update(bytes).digest();
  return Array.from(hash.subarray(0, 16))
    .map((b) => String.fromCharCode(97 + (b >> 4)) + String.fromCharCode(97 + (b & 0xf)))
    .join('');
}

function fileHashHex(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function scanArtifacts(): Artifact[] {
  if (!existsSync(ARTIFACTS_DIR)) return [];
  return readdirSync(ARTIFACTS_DIR)
    .map((f) => {
      const m = f.match(ARTIFACT_RE);
      if (!m) return null;
      const filePath = join(ARTIFACTS_DIR, f);
      return {
        fileName: f,
        browser: m[1],
        version: m[2],
        url: `${BASE_URL}/artifacts/${encodeURIComponent(f)}`,
        hash: `sha256:${fileHashHex(filePath)}`,
        size: statSync(filePath).size,
      } satisfies Artifact;
    })
    .filter((a): a is Artifact => a !== null)
    .toSorted((a, b) => {
      if (a.browser !== b.browser) return a.browser.localeCompare(b.browser);
      return cmpVer(b.version, a.version);
    });
}

// --- pre-computed IDs ---

const CHROME_ID = chromeExtensionId();
const FIREFOX_ID = process.env.FIREFOX_EXTENSION_ID || null;

// --- server ---

Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // update manifest for browser auto-update
    if (pathname === '/update.json') {
      const artifacts = scanArtifacts();
      const body: Record<string, unknown> = {};

      if (CHROME_ID) {
        const chromeArtifacts: Record<string, Artifact> = {};
        for (const a of artifacts.filter((a) => a.browser === 'chrome')) {
          const prev = chromeArtifacts[a.version];
          if (!prev || extname(a.fileName) === '.crx') {
            chromeArtifacts[a.version] = a;
          }
        }
        const updates = Object.values(chromeArtifacts)
          .toSorted((a, b) => cmpVer(b.version, a.version))
          .map((a) => ({ version: a.version, update_link: a.url }));
        if (updates.length > 0) {
          body.extensions = { [CHROME_ID]: { updates } };
        }
      }

      if (FIREFOX_ID) {
        const updates = artifacts
          .filter((a) => a.browser === 'firefox')
          .map((a) => ({
            version: a.version,
            update_link: a.url,
            update_hash: a.hash,
          }));
        if (updates.length > 0) {
          body.addons = { [FIREFOX_ID]: { updates } };
        }
      }

      return new Response(JSON.stringify(body, null, 2), {
        headers: { 'content-type': 'application/json' },
      });
    }

    // artifact listing + latest version
    if (pathname === '/manifest.json' || pathname === '/api/versions') {
      const artifacts = scanArtifacts();
      const latest: Record<string, Artifact> = {};
      for (const a of artifacts) {
        const prev = latest[a.browser];
        const sameVer = prev && cmpVer(a.version, prev.version) === 0;
        const prefer = sameVer && extname(a.fileName) === '.crx';
        if (!prev || cmpVer(a.version, prev.version) > 0 || prefer) {
          latest[a.browser] = a;
        }
      }
      return new Response(JSON.stringify({ artifacts, latest }, null, 2), {
        headers: { 'content-type': 'application/json' },
      });
    }

    // serve artifact files
    if (pathname.startsWith('/artifacts/')) {
      const fileName = pathname.slice('/artifacts/'.length);
      const filePath = join(ARTIFACTS_DIR, fileName);
      if (!existsSync(filePath) || !ARTIFACT_RE.test(fileName)) {
        return new Response('Not found', { status: 404 });
      }
      return new Response(Bun.file(filePath), {
        headers: {
          'content-disposition': `attachment; filename="${fileName}"`,
          'content-type': CONTENT_TYPES[extname(fileName)] || 'application/octet-stream',
        },
      });
    }

    // static files (token generator)
    const staticPath = pathname === '/' ? '/token-generator.html' : pathname;
    const publicFile = join(PUBLIC_DIR, staticPath);
    if (existsSync(publicFile)) {
      return new Response(Bun.file(publicFile));
    }

    return new Response('Not found', { status: 404 });
  },
});
