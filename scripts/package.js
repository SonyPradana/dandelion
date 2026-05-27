import 'dotenv/config';
import { ZipArchive } from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { packCrx3 } from './crx3.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const name = pkg.name;
const artifactsDir = path.join(root, 'artifacts');

fs.mkdirSync(artifactsDir, { recursive: true });

const target = process.argv[2];

function zipToBuffer(sourceDir) {
  return new Promise((resolve, reject) => {
    const absSource = path.resolve(root, sourceDir);
    if (!fs.existsSync(absSource)) {
      console.error(`Build directory not found: ${absSource}. Run build first.`);
      process.exit(1);
    }
    const chunks = [];
    const archive = new ZipArchive({ zlib: { level: 9 } });

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    archive.directory(absSource, false);
    archive.finalize();
  });
}

function copySignedXpi() {
  const webExtDir = path.join(root, 'web-ext-artifacts');
  if (!fs.existsSync(webExtDir)) {
    console.error('web-ext-artifacts not found. Run pnpm sign:firefox first.');
    process.exit(1);
  }

  const signedXpis = fs.readdirSync(webExtDir).filter((f) => f.endsWith('.xpi'));
  if (signedXpis.length === 0) {
    console.error('No signed .xpi found in web-ext-artifacts.');
    process.exit(1);
  }

  const signed = signedXpis[signedXpis.length - 1];
  const dest = path.join(artifactsDir, `${name}-firefox-v${version}-signed.xpi`);
  fs.cpSync(path.join(webExtDir, signed), dest);
  const size = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`  ${dest} (${size} KB)`);
}

// Chrome
if (!target || target === 'all' || target === 'chrome') {
  const crxPath = path.join(artifactsDir, `${name}-chrome-v${version}.crx`);
  console.log(`Packaging Chrome: ${crxPath}`);

  const zipBuffer = await zipToBuffer('dist/chrome');
  const privPem = fs.readFileSync(path.join(root, 'keys', 'development.pem'), 'utf-8');
  const crxBuffer = packCrx3(zipBuffer, privPem);

  fs.writeFileSync(crxPath, crxBuffer);
  const size = (fs.statSync(crxPath).size / 1024).toFixed(1);
  console.log(`  ${crxPath} (${size} KB)`);
}

// Firefox
if (!target || target === 'all' || target === 'firefox') {
  copySignedXpi();
}
