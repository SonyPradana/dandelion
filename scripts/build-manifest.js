import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const srcManifestPath = path.join(projectRoot, 'src', 'manifest.json');
const distManifestPath = path.join(projectRoot, 'dist', 'manifest.json');
const distDir = path.dirname(distManifestPath);

try {
  const manifestString = fs.readFileSync(srcManifestPath, 'utf8');
  const manifest = JSON.parse(manifestString);

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const targetHost = process.env.TARGET_HOST;
  if (targetHost) {
    const hosts = targetHost.split(';').filter(h => h);

    if (hosts.length > 0) {
      manifest.host_permissions = hosts;

      if (manifest.content_scripts && Array.isArray(manifest.content_scripts)) {
        manifest.content_scripts = manifest.content_scripts.map(script => ({
          ...script,
          matches: hosts,
        }));
      }
    }
  }

  fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));

  console.log(`manifest.json built successfully and placed in ${distDir}`);
} catch (error) {
  console.error('Failed to build manifest.json:', error);
  process.exit(1);
}
