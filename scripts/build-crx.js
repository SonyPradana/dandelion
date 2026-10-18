import 'dotenv/config';
import { ZipArchive } from 'archiver';
import { createHash, createPrivateKey, createPublicKey, sign as signWithKey } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function encodeVarint(value) {
  const bytes = [];
  let n = value;
  while (n > 0x7f) {
    bytes.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  bytes.push(n);
  return Buffer.from(bytes);
}

// Protobuf: length-delimited field.
function encodeField(fieldNumber, content) {
  return Buffer.concat([
    encodeVarint((fieldNumber << 3) | 2),
    encodeVarint(content.length),
    content,
  ]);
}

function encodeUint32LE(value) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value, 0);
  return buf;
}

// Same derivation Chrome uses: extension id = sha256(SPKI public key), first
// 16 bytes, each nibble mapped to 'a'-'p'.
export function crxExtensionId(publicKeyDer) {
  const digest = createHash('sha256').update(publicKeyDer).digest();
  return Array.from(digest.subarray(0, 16))
    .map((b) => String.fromCharCode(97 + (b >> 4)) + String.fromCharCode(97 + (b & 0x0f)))
    .join('');
}

export function zipDirectory(dir) {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks = [];
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
    archive.directory(dir, false);
    archive.finalize();
  });
}

// CRX3 layout: "Cr24" + uint32 version (3) + uint32 header length +
// CrxFileHeader protobuf + zip archive. The RSA-SHA256 signature covers
// "CRX3 SignedData\x00" + uint32(LE) signed-header length + signed header +
// archive, per chromium's crx3 spec.
export function packCrx(zipBuffer, privateKeyPem) {
  const privateKey = createPrivateKey(privateKeyPem);
  const publicKeyDer = createPublicKey(privateKey).export({ type: 'spki', format: 'der' });

  const crxId = createHash('sha256').update(publicKeyDer).digest().subarray(0, 16);
  const signedHeaderData = encodeField(1, crxId);
  const signedPayload = Buffer.concat([
    Buffer.from('CRX3 SignedData\x00'),
    encodeUint32LE(signedHeaderData.length),
    signedHeaderData,
    zipBuffer,
  ]);
  const signature = signWithKey('sha256', signedPayload, privateKey);

  const keyProof = Buffer.concat([encodeField(1, publicKeyDer), encodeField(2, signature)]);
  const header = Buffer.concat([encodeField(2, keyProof), encodeField(10_000, signedHeaderData)]);

  return Buffer.concat([
    Buffer.from('Cr24'),
    encodeUint32LE(3),
    encodeUint32LE(header.length),
    header,
    zipBuffer,
  ]);
}

async function main() {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const distDir = path.join(root, 'dist', 'chrome');
  const distManifest = path.join(distDir, 'manifest.json');
  if (!existsSync(distManifest)) {
    throw new Error(`Dist not found: ${distManifest}. Run pnpm build:chrome first.`);
  }

  if (!process.env.CRX_KEY_PATH) {
    throw new Error(
      'CRX_KEY_PATH is required: set it to the key the extension id is registered with ' +
        '(e.g. CRX_KEY_PATH=keys/development.pem for local builds).',
    );
  }
  const keyPath = path.resolve(root, process.env.CRX_KEY_PATH);
  if (!existsSync(keyPath)) {
    throw new Error(`CRX signing key not found: ${keyPath}`);
  }
  const privateKeyPem = readFileSync(keyPath, 'utf8');

  const version = JSON.parse(readFileSync(distManifest, 'utf8')).version ?? pkg.version;
  const zipBuffer = await zipDirectory(distDir);
  const crx = packCrx(zipBuffer, privateKeyPem);

  const publicKeyDer = createPublicKey(createPrivateKey(privateKeyPem)).export({
    type: 'spki',
    format: 'der',
  });
  const id = crxExtensionId(publicKeyDer);
  if (process.env.CHROME_EXTENSION_KEY) {
    const configuredId = crxExtensionId(Buffer.from(process.env.CHROME_EXTENSION_KEY, 'base64'));
    if (configuredId !== id) {
      throw new Error(
        `Signing key id ${id} does not match CHROME_EXTENSION_KEY (${configuredId}). ` +
          'Use the key the extension id was registered with.',
      );
    }
  }

  const artifactsDir = path.join(root, 'artifacts');
  mkdirSync(artifactsDir, { recursive: true });
  const outPath = path.join(artifactsDir, `${pkg.name}-chrome-v${version}.crx`);
  writeFileSync(outPath, crx);

  const size = (statSync(outPath).size / 1024).toFixed(1);
  console.log(`\n  Chrome CRX (${id})`);
  console.log(`  ${outPath} (${size} KB)\n`);
}

if (import.meta.main) await main();
