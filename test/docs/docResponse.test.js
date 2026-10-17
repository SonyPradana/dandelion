import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  chooseDocVariant,
  docHeaders,
  readDocEntry,
  resetDocCache,
} from '../../scripts/doc-response.js';

// Swap R: a fake codec keeps this test free of Bun globals while the fs stays
// real. Gzip is simulated by appending bytes so the gz variant differs in size.
const fakeCodec = {
  gzip: (input) => new Uint8Array([...input, 0]),
  hash: (input) => `h${input.byteLength}`,
};

const syntheticEntry = (rawSize, gzSize) => ({
  mtimeMs: 0,
  size: rawSize,
  raw: new Uint8Array(rawSize),
  gz: new Uint8Array(gzSize),
  etag: '"raw-etag"',
  gzEtag: '"gz-etag"',
});

describe('doc-response', () => {
  describe('chooseDocVariant', () => {
    it('serves gzip when accepted and smaller', () => {
      const entry = syntheticEntry(100, 40);
      expect(chooseDocVariant('gzip, deflate', null, entry)).toEqual({
        status: 200,
        body: entry.gz,
        encoding: 'gzip',
        etag: '"gz-etag"',
      });
    });

    it('serves raw when gzip is not smaller', () => {
      const entry = syntheticEntry(40, 41);
      const choice = chooseDocVariant('gzip', null, entry);
      expect(choice.encoding).toBeNull();
      expect(choice.etag).toBe('"raw-etag"');
      expect(choice.body).toBe(entry.raw);
    });

    it('serves raw when the client does not accept gzip', () => {
      expect(chooseDocVariant(null, null, syntheticEntry(100, 40)).encoding).toBeNull();
    });

    it('returns 304 with no body when the negotiated ETag matches', () => {
      expect(chooseDocVariant('gzip', '"gz-etag"', syntheticEntry(100, 40))).toEqual({
        status: 304,
        body: null,
        encoding: null,
        etag: '"gz-etag"',
      });
    });

    it('rejects a gzip ETag on a non-gzip request (per-representation ETags)', () => {
      expect(chooseDocVariant(null, '"gz-etag"', syntheticEntry(100, 40)).status).toBe(200);
    });
  });

  describe('docHeaders', () => {
    it('adds length and encoding for a gzip 200', () => {
      const headers = docHeaders('text/html; charset=utf-8', {
        status: 200,
        body: new Uint8Array(3),
        encoding: 'gzip',
        etag: '"e"',
      });
      expect(headers).toMatchObject({
        'content-type': 'text/html; charset=utf-8',
        'content-encoding': 'gzip',
        'content-length': '3',
        etag: '"e"',
        vary: 'Accept-Encoding',
      });
    });

    it('omits body headers on 304', () => {
      const headers = docHeaders('text/html', {
        status: 304,
        body: null,
        encoding: null,
        etag: '"e"',
      });
      expect(headers).not.toHaveProperty('content-encoding');
      expect(headers).not.toHaveProperty('content-length');
    });
  });

  describe('readDocEntry', () => {
    beforeEach(() => resetDocCache());

    it('reads a real doc asset and caches the entry', () => {
      const filePath = join(process.cwd(), 'public', 'doc', 'doc.css');
      const entry = readDocEntry(filePath, fakeCodec);
      expect(entry).not.toBeNull();
      expect(Buffer.compare(entry.raw, readFileSync(filePath))).toBe(0);
      expect(entry.gz.byteLength).toBe(entry.raw.byteLength + 1);
      expect(entry.etag).not.toBe(entry.gzEtag);
      expect(readDocEntry(filePath, fakeCodec)).toBe(entry);
    });

    it('returns null for a missing file instead of throwing', () => {
      expect(readDocEntry(join(process.cwd(), 'public', 'doc', 'nope.css'), fakeCodec)).toBeNull();
    });
  });
});
