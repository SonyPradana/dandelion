// @vitest-environment node
import { createHash, generateKeyPairSync, verify as cryptoVerify } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { crxExtensionId, packCrx, zipDirectory } from '../../scripts/build-crx.js';

// Minimal independent protobuf reader so the test does not reuse the encoder.
function readVarint(buf, offset) {
  let value = 0;
  let shift = 0;
  let pos = offset;
  for (;;) {
    const byte = buf[pos++];
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }
  return { value, offset: pos };
}

function readFields(buf) {
  const fields = [];
  let pos = 0;
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    expect(tag.value & 7).toBe(2);
    const len = readVarint(buf, pos);
    pos = len.offset;
    fields.push({ field: tag.value >> 3, content: buf.subarray(pos, pos + len.value) });
    pos += len.value;
  }
  return fields;
}

const FIXTURE_DIR = mkdtempSync(path.join(tmpdir(), 'dandelion-crx-'));

afterAll(() => rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('build-crx', () => {
  it('packs a CRX3 that parses and verifies against the signing key', async () => {
    writeFileSync(
      path.join(FIXTURE_DIR, 'manifest.json'),
      JSON.stringify({ manifest_version: 3, name: 'Fixture' }),
    );
    writeFileSync(path.join(FIXTURE_DIR, 'main.js'), 'console.log(1);\n');

    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const zipBuffer = await zipDirectory(FIXTURE_DIR);
    const crx = packCrx(zipBuffer, privateKey.export({ type: 'pkcs8', format: 'pem' }));

    expect(crx.subarray(0, 4).toString()).toBe('Cr24');
    expect(crx.readUInt32LE(4)).toBe(3);

    const headerEnd = 12 + crx.readUInt32LE(8);
    const header = crx.subarray(12, headerEnd);
    const archive = crx.subarray(headerEnd);
    expect(archive.subarray(0, 2).toString()).toBe('PK');
    expect(archive.equals(zipBuffer)).toBe(true);

    const fields = readFields(header);
    const proof = readFields(fields.find((f) => f.field === 2).content);
    const publicKeyDer = proof.find((f) => f.field === 1).content;
    const signature = proof.find((f) => f.field === 2).content;
    const signedHeaderData = fields.find((f) => f.field === 10_000).content;
    const crxId = readFields(signedHeaderData).find((f) => f.field === 1).content;

    expect(
      Buffer.from(publicKeyDer).equals(publicKey.export({ type: 'spki', format: 'der' })),
    ).toBe(true);

    const expectedCrxId = createHash('sha256').update(publicKeyDer).digest().subarray(0, 16);
    expect(Buffer.from(crxId).equals(expectedCrxId)).toBe(true);

    const expectedId = Array.from(expectedCrxId)
      .map((b) => 'abcdefghijklmnop'[b >> 4] + 'abcdefghijklmnop'[b & 0x0f])
      .join('');
    expect(crxExtensionId(publicKeyDer)).toBe(expectedId);
    expect(expectedId).toMatch(/^[a-p]{32}$/);

    const lengthLE = Buffer.alloc(4);
    lengthLE.writeUInt32LE(signedHeaderData.length);
    const signedPayload = Buffer.concat([
      Buffer.from('CRX3 SignedData\x00'),
      lengthLE,
      signedHeaderData,
      archive,
    ]);
    expect(cryptoVerify('sha256', signedPayload, publicKey, signature)).toBe(true);
  });
});
