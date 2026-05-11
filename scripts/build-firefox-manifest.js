import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = process.argv[2] || 'dist/firefox';
const start = performance.now();

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const manifest = JSON.parse(
  readFileSync(path.join(root, 'src', 'manifest.firefox.json'), 'utf8'),
);
manifest.version = pkg.version.replace(/-.*$/, '');

const targetHost = process.env.TARGET_HOST;
if (targetHost) {
  const hosts = targetHost.split(';').filter((h) => h);
  if (hosts.length > 0) {
    manifest.host_permissions = hosts;
    if (manifest.content_scripts && Array.isArray(manifest.content_scripts)) {
      manifest.content_scripts = manifest.content_scripts.map((s) => ({
        ...s,
        matches: hosts,
      }));
    }
  }
}

const firefoxId = process.env.FIREFOX_EXTENSION_ID;
if (!firefoxId) {
  console.error('FIREFOX_EXTENSION_ID not set in .env');
  process.exit(1);
}
manifest.browser_specific_settings ||= {};
manifest.browser_specific_settings.gecko ||= {};
manifest.browser_specific_settings.gecko.id = firefoxId;

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(root, outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

const duration = (performance.now() - start).toFixed(2);
console.log(`Manifest (${outDir}) built in ${duration}ms`);
