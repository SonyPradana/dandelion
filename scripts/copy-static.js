import { cpSync, mkdirSync } from 'fs';
import path from 'path';

const start = performance.now();
const outDir = process.argv[2] || 'dist/chrome';

const copies = [
  ['src/view/popup.html', `${outDir}/view/popup.html`],
  ['src/view/popup.css', `${outDir}/view/popup.css`],
  ['src/view/components/KeywordList.css', `${outDir}/view/components/KeywordList.css`],
  ['src/view/components/KeyValueList.css', `${outDir}/view/components/KeyValueList.css`],
  ['src/view/components/ProfileManager.css', `${outDir}/view/components/ProfileManager.css`],
];

for (const [src, dest] of copies) {
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest);
}

cpSync('icons', `${outDir}/icons`, { recursive: true });

const duration = (performance.now() - start).toFixed(2);
console.log(`Static files copied in ${duration}ms`);
