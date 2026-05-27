import { createHash, createSign, createPublicKey, createPrivateKey } from 'node:crypto';

export function packCrx3(zipBuffer, privateKeyPem) {
  const privateKey = createPrivateKey(privateKeyPem);
  const publicKey = createPublicKey(privateKey);
  const pubKeyDer = publicKey.export({ type: 'spki', format: 'der' });

  const crxId = createHash('sha256').update(pubKeyDer).digest().subarray(0, 16);

  const signedData = encMap([
    [encStr('crx_id'), encBytes(crxId)],
    [encStr('verified_contents'), encNull()],
  ]);

  const sign = createSign('RSA-SHA256');
  sign.update(Buffer.concat([Buffer.from('CRX3 SignedData\0'), signedData]));
  const signature = sign.sign(privateKey);

  const header = encMap([
    [encStr('signed'), encBytes(signedData)],
    [
      encStr('signatures'),
      encArray([
        encMap([
          [encStr('public_key'), encBytes(pubKeyDer)],
          [encStr('signature'), encBytes(signature)],
          [encStr('proof'), encNull()],
        ]),
      ]),
    ],
  ]);

  const magic = Buffer.from('Cr24');
  const version = Buffer.alloc(4);
  version.writeUInt32LE(3, 0);
  const headerLen = Buffer.alloc(4);
  headerLen.writeUInt32LE(header.length, 0);

  return Buffer.concat([magic, version, headerLen, header, zipBuffer]);
}

function encLen(major, len) {
  if (len < 24) return Buffer.from([(major << 5) | len]);
  if (len < 0x100) return Buffer.from([(major << 5) | 24, len]);
  if (len < 0x10000) {
    const b = Buffer.alloc(3);
    b[0] = (major << 5) | 25;
    b.writeUInt16BE(len, 1);
    return b;
  }
  if (len < 0x100000000) {
    const b = Buffer.alloc(5);
    b[0] = (major << 5) | 26;
    b.writeUInt32BE(len, 1);
    return b;
  }
  const b = Buffer.alloc(9);
  b[0] = (major << 5) | 27;
  b.writeBigUInt64BE(BigInt(len), 1);
  return b;
}

function encBytes(buf) {
  return Buffer.concat([encLen(2, buf.length), buf]);
}

function encStr(s) {
  const buf = Buffer.from(s, 'utf-8');
  return Buffer.concat([encLen(3, buf.length), buf]);
}

function encArray(items) {
  return Buffer.concat([encLen(4, items.length), ...items]);
}

function encMap(entries) {
  return Buffer.concat([encLen(5, entries.length), ...entries.flat()]);
}

function encNull() {
  return Buffer.from([0xf6]);
}
