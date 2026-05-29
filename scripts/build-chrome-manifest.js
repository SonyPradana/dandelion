import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const start = performance.now();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const srcManifestPath = path.join(projectRoot, 'src', 'manifest.json');
const distManifestPath = path.join(projectRoot, 'dist', 'chrome', 'manifest.json');

const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

try {
  const manifestString = fs.readFileSync(srcManifestPath, 'utf8');
  const manifest = JSON.parse(manifestString);

  if (process.env.NIGHTLY === 'true') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    manifest.version = `${pkg.version.replace(/-.*$/, '')}.${y}${m}${d}`;
  } else {
    manifest.version = pkg.version.replace(/-.*$/, '');
  }

  fs.mkdirSync(path.dirname(distManifestPath), { recursive: true });

  const targetHost = process.env.TARGET_HOST;
  if (targetHost) {
    const hosts = targetHost.split(';').filter((h) => h);

    if (hosts.length > 0) {
      manifest.host_permissions = hosts;

      if (manifest.content_scripts && Array.isArray(manifest.content_scripts)) {
        manifest.content_scripts = manifest.content_scripts.map((script) => ({
          ...script,
          matches: hosts,
        }));
      }
    }
  }

  if (process.env.CHROME_EXTENSION_KEY) {
    manifest.key = process.env.CHROME_EXTENSION_KEY;
  }

  fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));

  const duration = (performance.now() - start).toFixed(2);
  console.log(`Chrome manifest build in ${duration}ms`);
} catch (error) {
  console.error('Failed to build manifest.json:', error);
  process.exit(1);
}
