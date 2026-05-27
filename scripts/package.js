import 'dotenv/config';
import crx3 from 'crx3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const name = pkg.name;
const artifactsDir = path.join(root, 'artifacts');

fs.mkdirSync(artifactsDir, { recursive: true });

const target = process.argv[2];

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
  const manifestPath = path.join(root, 'dist', 'chrome', 'manifest.json');
  const keyPath = path.join(root, 'keys', 'development.pem');

  console.log(`Packaging Chrome: ${crxPath}`);
  await crx3([manifestPath], { keyPath, crxPath });
  const size = (fs.statSync(crxPath).size / 1024).toFixed(1);
  console.log(`  ${crxPath} (${size} KB)`);
}

// Firefox
if (!target || target === 'all' || target === 'firefox') {
  copySignedXpi();
}
