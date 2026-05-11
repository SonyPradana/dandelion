import 'dotenv/config';
import { spawnSync } from 'child_process';
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'dist', 'firefox');
const start = performance.now();

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

function main() {
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true });
  }

  console.log('Compiling Firefox bundles...');
  const result = spawnSync('rolldown', ['-c'], {
    cwd: root,
    env: { ...process.env, OUTPUT_DIR: 'dist/firefox' },
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status);
  }

  console.log('Copying static files...');
  const copies = [
    ['src/view/popup.html', `${outDir}/view/popup.html`],
    ['src/view/popup.css', `${outDir}/view/popup.css`],
    ['src/view/components/KeywordList.css', `${outDir}/view/components/KeywordList.css`],
    ['src/view/components/KeyValueList.css', `${outDir}/view/components/KeyValueList.css`],
  ];
  for (const [src, dest] of copies) {
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
  cpSync('icons', `${outDir}/icons`, { recursive: true });

  console.log('Building Firefox manifest...');
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
  writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const duration = (performance.now() - start).toFixed(2);
  console.log(`\nFirefox build complete in ${duration}ms`);
  console.log(`  Output: ${outDir}`);
}

main();
