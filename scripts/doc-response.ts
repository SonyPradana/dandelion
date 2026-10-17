// Doc-serving primitives shared by the HTTP layer: reads a static file under
// public/doc/, keeps raw + gzipped bytes cached in memory (invalidated on
// mtime/size change), and decides the representation for a request.
//
// Kept out of serve.ts so the decision logic is pure and testable: importing
// serve.ts would boot the server, the database, and the file watchers. The
// Bun-specific encoding is injectable so tests can swap it out.

import { readFileSync, statSync } from 'node:fs';

export interface DocCodec {
  gzip: (input: Uint8Array) => Uint8Array;
  hash: (input: Uint8Array) => string;
}

export interface DocEntry {
  mtimeMs: number;
  size: number;
  raw: Uint8Array;
  gz: Uint8Array;
  etag: string;
  gzEtag: string;
}

export interface DocChoice {
  status: 200 | 304;
  body: Uint8Array | null;
  encoding: 'gzip' | null;
  etag: string;
}

const bunCodec: DocCodec = {
  gzip: (input) => Bun.gzipSync(input),
  hash: (input) => Bun.hash(input).toString(36),
};

const docCache = new Map<string, DocEntry>();

// Returns null when the file is missing — including the narrow window where
// it disappears between the route's existence check and this read (deploys).
export function readDocEntry(filePath: string, codec: DocCodec = bunCodec): DocEntry | null {
  try {
    const stat = statSync(filePath);
    const cached = docCache.get(filePath);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached;
    const raw = readFileSync(filePath);
    const gz = codec.gzip(raw);
    const entry: DocEntry = {
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      raw,
      gz,
      etag: `"${codec.hash(raw)}"`,
      gzEtag: `"${codec.hash(gz)}"`,
    };
    docCache.set(filePath, entry);
    return entry;
  } catch {
    return null;
  }
}

export function resetDocCache(): void {
  docCache.clear();
}

// Picks the representation: gzip only when the client accepts it and it is
// actually smaller, with a distinct ETag per representation (paired with
// `vary: Accept-Encoding` by docHeaders).
export function chooseDocVariant(
  acceptEncoding: string | null,
  ifNoneMatch: string | null,
  entry: DocEntry,
): DocChoice {
  const useGzip =
    /\bgzip\b/.test(acceptEncoding ?? '') && entry.gz.byteLength < entry.raw.byteLength;
  const etag = useGzip ? entry.gzEtag : entry.etag;
  if (ifNoneMatch === etag) return { status: 304, body: null, encoding: null, etag };
  return {
    status: 200,
    body: useGzip ? entry.gz : entry.raw,
    encoding: useGzip ? 'gzip' : null,
    etag,
  };
}

export function docHeaders(contentType: string, choice: DocChoice): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': contentType,
    etag: choice.etag,
    'cache-control': 'no-cache',
    vary: 'Accept-Encoding',
  };
  if (choice.status === 200 && choice.body !== null) {
    headers['content-length'] = String(choice.body.byteLength);
    if (choice.encoding !== null) headers['content-encoding'] = choice.encoding;
  }
  return headers;
}
