import { ZipArchive } from 'archiver';
import fs from 'fs';
import path from 'path';

const __dirname = import.meta.dir;
const root = path.resolve(__dirname, '..');
const pkg = await Bun.file(path.join(root, 'package.json')).json();
const version = pkg.version;
const name = pkg.name;
const artifactsDir = path.join(root, 'artifacts');

fs.mkdirSync(artifactsDir, { recursive: true });

const target = process.argv[2];

function compress(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const absSource = path.resolve(root, sourceDir);
    if (!fs.existsSync(absSource)) {
      console.error(`Build directory not found: ${absSource}. Run build first.`);
      process.exit(1);
    }

    const output = fs.createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => {
      const size = (fs.statSync(outputPath).size / 1024).toFixed(1);
      console.log(`  ${outputPath} (${size} KB)`);
      resolve();
    });

    archive.on('error', reject);

    archive.pipe(output);
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

// Chrome (.zip — Load Unpacked)
if (!target || target === 'all' || target === 'chrome') {
  const zipPath = path.join(artifactsDir, `${name}-chrome-v${version}.zip`);
  console.log(`Packaging Chrome: ${zipPath}`);
  await compress('dist/chrome', zipPath);
}

// Chrome Nightly (no version in filename, date-stamped)
if (target === 'chrome-nightly') {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const zipPath = path.join(artifactsDir, `${name}-chrome-nightly-${y}${m}${d}.zip`);
  console.log(`Packaging Chrome Nightly: ${zipPath}`);
  await compress('dist/chrome', zipPath);
}

// Firefox (signed .xpi — auto-update via server)
if (!target || target === 'all' || target === 'firefox') {
  copySignedXpi();
}
