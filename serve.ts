import { readdirSync, existsSync, readFileSync, statSync, watch } from 'fs';
import { join, extname } from 'path';

// ── Routes ──
//   /                     → Landing page (index.html)
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

const PUBLIC_URL = process.env.PUBLIC_URL || '';
let BASE_URL = '';

const STABLE_RE = /^dandelion-(chrome|firefox)-v(\d+\.\d+\.\d+)(?:-signed)?\.(zip|xpi)$/;
const NIGHTLY_RE = /^dandelion-(chrome|firefox)-nightly-(\d{8})\.(zip|xpi)$/;

const CONTENT_TYPES: Record<string, string> = {
  '.zip': 'application/zip',
  '.xpi': 'application/x-xpinstall',
};

const ALLOWED_STATIC_EXT = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.ico',
  '.png',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.txt',
  '.map',
]);

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
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(Buffer.from(key, 'base64'));
  const hash = Buffer.from(hasher.digest() as ArrayBuffer);
  return Array.from(hash.subarray(0, 16))
    .map((b) => String.fromCharCode(97 + (b >> 4)) + String.fromCharCode(97 + (b & 0xf)))
    .join('');
}

function fileHashHex(filePath: string): string {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(readFileSync(filePath));
  return hasher.digest('hex') as string;
}

// --- artifact cache + fs.watch invalidation ---

let _cache: Artifact[] | null = null;

function invalidateCache(): void {
  _cache = null;
}

if (existsSync(ARTIFACTS_DIR)) {
  watch(ARTIFACTS_DIR, { persistent: false }, invalidateCache);
}

function buildArtifacts(origin: string): Artifact[] {
  if (!existsSync(ARTIFACTS_DIR)) return [];
  return readdirSync(ARTIFACTS_DIR)
    .map((f) => {
      const stable = f.match(STABLE_RE);
      const nightly = f.match(NIGHTLY_RE);
      const m = stable || nightly;
      if (!m) return null;
      const filePath = join(ARTIFACTS_DIR, f);
      return {
        fileName: f,
        browser: m[1],
        version: stable ? stable[2] : `nightly-${nightly![2]}`,
        url: `${origin}/artifacts/${encodeURIComponent(f)}`,
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

function getArtifacts(): Artifact[] {
  return (_cache ??= buildArtifacts(PUBLIC_URL || BASE_URL));
}

function findArtifact(fileName: string): Artifact | undefined {
  return getArtifacts().find((a) => a.fileName === fileName);
}

// --- pre-computed IDs ---

const CHROME_ID = chromeExtensionId();
const FIREFOX_ID = process.env.FIREFOX_EXTENSION_ID || null;

// --- response helpers ---

function notFound(): Response {
  return new Response('Not found', { status: 404 });
}

// --- server ---

async function handleRequest(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);

  if (pathname === '/update.json') {
    const body: Record<string, unknown> = {};
    if (FIREFOX_ID) {
      const updates = getArtifacts()
        .filter((a) => a.browser === 'firefox')
        .map(({ version, url, hash }) => ({ version, update_link: url, update_hash: hash }));
      if (updates.length > 0) {
        body.addons = { [FIREFOX_ID]: { updates } };
      }
    }
    return new Response(JSON.stringify(body, null, 2), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  }

  // ── artifact listing + latest version ──────────────────────────────
  if (pathname === '/manifest.json' || pathname === '/api/versions') {
    const artifacts = getArtifacts();
    const latest: Record<string, Artifact> = {};
    const nightly: Record<string, Artifact> = {};
    for (const a of artifacts) {
      if (a.version.startsWith('nightly-')) {
        if (!nightly[a.browser] || cmpVer(a.version, nightly[a.browser].version) > 0) {
          nightly[a.browser] = a;
        }
      } else {
        if (!latest[a.browser] || cmpVer(a.version, latest[a.browser].version) > 0) {
          latest[a.browser] = a;
        }
      }
    }
    return new Response(JSON.stringify({ artifacts, latest, nightly }, null, 2), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  }

  // ── serve artifact files ────────────────────────────────────────────
  if (pathname.startsWith('/artifacts/')) {
    const raw = pathname.slice('/artifacts/'.length);

    // path traversal guard (raw catches unencoded, fileName catches encoded)
    if (raw.includes('/') || raw.includes('..')) return notFound();
    const fileName = decodeURIComponent(raw);
    if (fileName.includes('/') || fileName.includes('..')) return notFound();
    if (!STABLE_RE.test(fileName) && !NIGHTLY_RE.test(fileName)) return notFound();

    const filePath = join(ARTIFACTS_DIR, fileName);
    if (!existsSync(filePath)) return notFound();

    // ── ETag ──
    const artifact = findArtifact(fileName);
    const etag = artifact ? `"${artifact.hash.replace('sha256:', '')}"` : null;

    // Conditional GET — 304 Not Modified
    if (etag && req.headers.get('if-none-match') === etag) {
      return new Response(null, {
        status: 304,
        headers: { etag },
      });
    }

    const ext = extname(fileName);
    return new Response(Bun.file(filePath), {
      headers: {
        'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'content-disposition': `attachment; filename="${fileName}"`,
        'content-length': String(artifact?.size ?? statSync(filePath).size),
        'cache-control': 'public, max-age=31536000, immutable',
        ...(etag ? { etag } : {}),
      },
    });
  }

  if (pathname === '/favicon.ico') {
    const faviconPath = join(ROOT, 'icons', 'icon48.png');
    if (!existsSync(faviconPath)) return notFound();
    return new Response(Bun.file(faviconPath), {
      headers: { 'content-type': 'image/png' },
    });
  }

  const staticPath = pathname === '/' ? '/index.html' : pathname;

  if (!ALLOWED_STATIC_EXT.has(extname(staticPath))) return notFound();

  const publicFile = join(PUBLIC_DIR, staticPath);
  if (existsSync(publicFile)) return new Response(Bun.file(publicFile));

  return notFound();
}

for (let i = 0; i < 20; i++) {
  const port = PREFERRED_PORT + i;
  try {
    PORT = port;
    BASE_URL = `${PROTOCOL}://${HOST}:${port}`;
    Bun.serve({
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
    if (i === 19) {
      throw new Error(`No available port after 20 attempts starting from ${PREFERRED_PORT}`);
    }
  }
}

console.log(`\n  Dandelion Server`);
console.log(`  Local:   ${PROTOCOL}://localhost:${PORT}/`);
console.log(`  Public:  ${PUBLIC_URL || '(not configured, using local URL)'}`);
console.log(`  Update:  ${PUBLIC_URL || BASE_URL}/update.json`);
console.log(`  TLS:     ${hasTls ? 'enabled' : 'disabled (HTTP fallback)'}`);
console.log(`  Chrome:  ${CHROME_ID || '(not configured)'}`);
console.log(`  Firefox: ${FIREFOX_ID || '(not configured)'}\n`);
