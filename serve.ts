import { readdirSync, existsSync, readFileSync, statSync, watch, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { Database } from 'bun:sqlite';

// ── Routes ──
//   /                     → Landing page (index.html)
//   /token-generator.html → Token generator page
//   /update.json          → Auto-update manifest (Firefox addon update)
//   /manifest.json        → Version listing of all artifacts
//   /api/versions         → Alias for /manifest.json
//   /artifacts/<file>     → Artifact download (.zip, .xpi)
//   /health               → Health check (GET & HEAD)
//   /api/share            → Create a share link (POST)
//   /share/<id>           → View a shared token (GET)
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

const startTime = Date.now();

// --- database ---

const DATA_DIR = join(ROOT, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(join(DATA_DIR, 'shares.db'));

db.run(`CREATE TABLE IF NOT EXISTS shared_tokens (
  id TEXT PRIMARY KEY,
  jwt TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  max_views INTEGER NOT NULL DEFAULT 10,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
)`);

db.run(`DELETE FROM shared_tokens WHERE expires_at < ?`, [Date.now()]);
setInterval(
  () => {
    db.run(`DELETE FROM shared_tokens WHERE expires_at < ?`, [Date.now()]);
  },
  60 * 60 * 1000,
);

// --- rate limiter ---

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// --- helpers ---

function cmpVer(a: string, b: string): number {
  const normalize = (v: string) =>
    v.startsWith('nightly-') ? v.slice(8).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3') : v;
  const pa = normalize(a).split('.').map(Number);
  const pb = normalize(b).split('.').map(Number);
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

// --- share helpers ---

interface ShareRow {
  id: string;
  jwt: string;
  views: number;
  max_views: number;
  created_at: number;
  expires_at: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function base64urlDecode(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}

function decodeJWTPayload(jwt: string): Record<string, unknown> {
  try {
    return JSON.parse(base64urlDecode(jwt.split('.')[1]));
  } catch {
    return {};
  }
}

function renderSharePage(row: ShareRow): string {
  const payload = decodeJWTPayload(row.jwt);
  const remaining = Math.max(0, row.expires_at - Date.now());
  const remainingH = Math.floor(remaining / 3_600_000);
  const remainingM = Math.floor((remaining % 3_600_000) / 60_000);
  const remainingS = Math.floor((remaining % 60_000) / 1000);
  let remainingText = '';
  if (remainingH > 0) {
    remainingText = `${remainingH}h ${remainingM}m`;
  } else if (remainingM > 0) {
    remainingText = `${remainingM}m ${remainingS}s`;
  } else {
    remainingText = `${remainingS}s`;
  }

  const viewPercent = Math.min(100, Math.round((row.views / row.max_views) * 100));
  const features = Array.isArray(payload.features)
    ? (payload.features as string[]).join(', ')
    : '-';
  const versionAllowed = Array.isArray(payload.version_allowed)
    ? (payload.version_allowed as string[]).join(', ')
    : '-';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shared Token — Dandelion</title>
  <link rel="stylesheet" href="/token-generator.css" />
  <style>
    .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; }
    .badge.active { background:#238636; color:#fff; }
    .view-bar { height:6px; background:#21262d; border-radius:3px; margin-top:0.75rem; overflow:hidden; }
    .view-bar-fill { height:100%; background:#1f6feb; border-radius:3px; transition:width .3s; }
    .view-text { font-size:0.75rem; color:#8b949e; margin-top:0.375rem; }
    .meta-row { display:flex; gap:1rem; margin-top:0.75rem; font-size:0.75rem; color:#8b949e; flex-wrap:wrap; }
    .meta-row span { flex:1; min-width:140px; }
    #jwtOutput { font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace; font-size:0.813rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Dandelion</h1>
      <p class="subtitle">Shared Quota Token <span class="badge active">Active</span></p>
    </header>

    <table class="summary">
      <tr><td>Token ID</td><td>${escapeHtml(String(payload.license_id ?? '-'))}</td></tr>
      <tr><td>Features</td><td>${escapeHtml(features)}</td></tr>
      <tr><td>Total Limit</td><td>${escapeHtml(String(payload.total_limit ?? '-'))}</td></tr>
      <tr><td>Daily Limit</td><td>${escapeHtml(String(payload.daily_limit ?? '-'))}</td></tr>
      <tr><td>Version Allowed</td><td>${escapeHtml(versionAllowed)}</td></tr>
      <tr><td>Expires (JWT)</td><td>${payload.exp ? escapeHtml(new Date((payload.exp as number) * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC') : '-'}</td></tr>
    </table>

    <div class="view-bar">
      <div class="view-bar-fill" style="width:${viewPercent}%"></div>
    </div>
    <p class="view-text">Viewed ${row.views} of ${row.max_views} times</p>

    <div class="meta-row">
      <span>Created: ${new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
      <span>Expires: ${new Date(row.expires_at).toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
      <span>Time remaining: ${remainingText}</span>
    </div>

    <div class="output-row" style="margin-top:1rem">
      <textarea id="jwtOutput" rows="4" readonly>${escapeHtml(row.jwt)}</textarea>
      <button id="copyBtn">Copy</button>
    </div>
  </div>
  <script>
    document.getElementById('copyBtn').addEventListener('click', async () => {
      const btn = document.getElementById('copyBtn');
      try {
        await navigator.clipboard.writeText(document.getElementById('jwtOutput').value);
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      } catch {
        document.getElementById('jwtOutput').select();
        document.execCommand('copy');
      }
    });
  </script>
</body>
</html>`;
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

  // ── health check ──────────────────────────────────────────────────
  if (pathname === '/health') {
    const t0 = performance.now();
    const body = JSON.stringify({
      status: 'ok',
      uptime: (Date.now() - startTime) / 1000,
      responseTime: Math.round(performance.now() - t0),
    });
    return new Response(req.method === 'HEAD' ? null : body, {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
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

  // ── share link ──────────────────────────────────────────────────────
  if (pathname === '/api/share' && req.method === 'POST') {
    try {
      // ── rate limit ──
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('cf-connecting-ip') ||
        'unknown';
      if (!checkRateLimit(ip)) {
        return Response.json({ error: 'Too many requests' }, { status: 429 });
      }

      const body = await req.json();
      if (!body.jwt || typeof body.jwt !== 'string') {
        return Response.json({ error: 'Invalid JWT' }, { status: 400 });
      }

      // ── JWT size limit (10KB) ──
      if (body.jwt.length > 10_000) {
        return Response.json({ error: 'JWT too large' }, { status: 400 });
      }

      // ── JWT format: 3 parts ──
      const parts = body.jwt.split('.');
      if (parts.length !== 3) {
        return Response.json({ error: 'Invalid JWT format' }, { status: 400 });
      }

      // ── JWT payload valid JSON ──
      try {
        const decoded = base64urlDecode(parts[1]);
        const payload = JSON.parse(decoded);
        if (!payload || typeof payload !== 'object') throw new Error('Invalid JWT payload');
      } catch {
        return Response.json({ error: 'Invalid JWT payload' }, { status: 400 });
      }

      // ── max active rows ──
      const count = (db.query('SELECT COUNT(*) as c FROM shared_tokens').get() as { c: number }).c;
      if (count >= 500) {
        db.run(
          `DELETE FROM shared_tokens WHERE id IN (SELECT id FROM shared_tokens ORDER BY created_at ASC LIMIT ?)`,
          [count - 500 + 1],
        );
      }

      const id = Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const now = Date.now();
      db.run(
        `INSERT INTO shared_tokens (id, jwt, views, max_views, created_at, expires_at) VALUES (?, ?, 0, 10, ?, ?)`,
        [id, body.jwt, now, now + 24 * 60 * 60 * 1000],
      );
      return Response.json({ url: `${PUBLIC_URL || BASE_URL}/share/${id}` });
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
  }

  const shareMatch = pathname.match(/^\/share\/([a-f0-9]{8})$/);
  if (shareMatch) {
    const row = db
      .query('SELECT * FROM shared_tokens WHERE id = ?')
      .get(shareMatch[1]) as ShareRow | null;
    if (!row) return notFound();
    const now = Date.now();
    if (row.expires_at < now) {
      db.run('DELETE FROM shared_tokens WHERE id = ?', [row.id]);
      return new Response('Link expired', { status: 410 });
    }
    if (row.views >= row.max_views) {
      return new Response('View limit reached', { status: 410 });
    }
    db.run('UPDATE shared_tokens SET views = views + 1 WHERE id = ?', [row.id]);
    return new Response(renderSharePage(row), {
      headers: { 'content-type': 'text/html' },
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
