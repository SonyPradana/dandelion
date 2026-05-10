import 'dotenv/config';
import { execSync } from 'child_process';
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

function compress(sourceDir, outputPath) {
  const absSource = path.resolve(root, sourceDir);
  if (!fs.existsSync(absSource)) {
    console.error(`Build directory not found: ${absSource}. Run build first.`);
    process.exit(1);
  }
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${absSource}\\*' -DestinationPath '${outputPath}' -Force"`,
    { stdio: 'inherit' },
  );
  const size = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`  ${outputPath} (${size} KB)`);
}

function signFirefox() {
  const issuer = process.env.AMO_JWT_ISSUER;
  const secret = process.env.AMO_JWT_SECRET;

  if (!issuer || !secret) {
    console.error(
      '\nAMO_JWT_ISSUER and AMO_JWT_SECRET must be set in .env to sign Firefox extension.',
    );
    console.error('Get API keys at: https://addons.mozilla.org/en-US/developers/addon/api/key/\n');
    process.exit(1);
  }

  const sourceDir = path.resolve(root, 'dist', 'firefox');
  if (!fs.existsSync(sourceDir)) {
    console.error('dist/firefox not found. Run pnpm build:firefox first.');
    process.exit(1);
  }

  const webExtDir = path.join(root, 'web-ext-artifacts');
  if (fs.existsSync(webExtDir)) {
    fs.rmSync(webExtDir, { recursive: true });
  }

  console.log('Signing Firefox extension via AMO...');
  execSync(
    `web-ext sign --source-dir "${sourceDir}" --api-key "${issuer}" --api-secret "${secret}" --channel unlisted`,
    { cwd: root, stdio: 'inherit' },
  );

  const signedXpis = fs.readdirSync(webExtDir).filter((f) => f.endsWith('.xpi'));
  if (signedXpis.length > 0) {
    const signed = signedXpis[signedXpis.length - 1];
    const dest = path.join(artifactsDir, `${name}-firefox-v${version}-signed.xpi`);
    fs.cpSync(path.join(webExtDir, signed), dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`  ${dest} (${size} KB)`);
  }
}

// Chrome
if (!target || target === 'all' || target === 'chrome') {
  const zipPath = path.join(artifactsDir, `${name}-chrome-v${version}.zip`);
  console.log(`Packaging Chrome: ${zipPath}`);
  compress('dist/chrome', zipPath);
}

// Firefox
if (!target || target === 'all' || target === 'firefox') {
  signFirefox();
}
