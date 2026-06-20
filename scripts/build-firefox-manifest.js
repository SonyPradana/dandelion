import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const __dirname = import.meta.dir;
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'dist', 'firefox');
const start = performance.now();

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

console.log('Building Firefox manifest...');
const manifest = JSON.parse(readFileSync(path.join(root, 'src', 'manifest.firefox.json'), 'utf8'));
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

if (process.env.PUBLIC_URL) {
  manifest.browser_specific_settings.gecko.update_url = `${process.env.PUBLIC_URL}/update.json`;
} else if (process.env.HOST) {
  manifest.browser_specific_settings.gecko.update_url = `https://${process.env.HOST}/update.json`;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

const duration = (performance.now() - start).toFixed(2);
console.log(`Firefox manifest build in ${duration}ms`);
