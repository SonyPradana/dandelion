import { createHash } from 'node:crypto';
import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

// ── Routes ──
//   /                     → Token generator UI (redirects to /token-generator.html)
//   /token-generator.html → Token generator page
//   /update.json          → Auto-update manifest (Firefox addon update)
//   /manifest.json        → Version listing of all artifacts
//   /api/versions         → Alias for /manifest.json
//   /artifacts/<file>     → Artifact download (.zip, .xpi)
//   /<any public file>    → Static files served from public/

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

const PREFERRED_PORT = parseInt(process.env.PORT || '3000', 10);
let PORT = 0;
const ROOT = import.meta.dir!;
const ARTIFACTS_DIR = join(ROOT, 'artifacts');
const PUBLIC_DIR = join(ROOT, 'public');

const TLS_CERT = process.env.TLS_CERT || join(ROOT, 'keys', 'localhost.pem');
const TLS_KEY = process.env.TLS_KEY || join(ROOT, 'keys', 'localhost-key.pem');
const hasTls = existsSync(TLS_CERT) && existsSync(TLS_KEY);
const PROTOCOL = hasTls ? 'https' : 'http';
const HOST = process.env.HOST || 'localhost';
let BASE_URL = '';

const ARTIFACT_RE = /^dandelion-(chrome|firefox)-v(\d+\.\d+\.\d+)(?:-signed)?\.(zip|xpi)$/;

const CONTENT_TYPES: Record<string, string> = {
  '.zip': 'application/zip',
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

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // update manifest for browser auto-update
  if (pathname === '/update.json') {
    const artifacts = scanArtifacts();
    const body: Record<string, unknown> = {};

    if (CHROME_ID) {
      const updates = artifacts
        .filter((a) => a.browser === 'chrome')
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
      if (!latest[a.browser] || cmpVer(a.version, latest[a.browser].version) > 0) {
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
}

for (let i = 0; i < 20; i++) {
  const port = PREFERRED_PORT + i;
  try {
    PORT = port;
    BASE_URL = `${PROTOCOL}://${HOST}:${port}`;
    const server = Bun.serve({
      port,
      tls: hasTls ? { cert: Bun.file(TLS_CERT), key: Bun.file(TLS_KEY) } : undefined,
      async fetch(req: Request): Promise<Response> {
        const { pathname } = new URL(req.url);
        const res = await handleRequest(req);
        console.log(`  ${req.method} ${pathname} → ${res.status}`);
        return res;
      },
    });
    break;
  } catch {
    if (i === 19)
      throw new Error(`No available port after 20 attempts starting from ${PREFERRED_PORT}`);
  }
}

console.log(`\n  Dandelion Server`);
console.log(`  Local:   ${PROTOCOL}://localhost:${PORT}/`);
console.log(`  Update:  ${BASE_URL}/update.json`);
console.log(`  TLS:     ${hasTls ? 'enabled' : 'disabled (HTTP fallback)'}`);
console.log(`  Chrome:  ${CHROME_ID || '(not configured)'}`);
console.log(`  Firefox: ${FIREFOX_ID || '(not configured)'}\n`);
