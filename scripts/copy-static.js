import { cpSync, mkdirSync } from 'fs';

const start = performance.now();
const copies = [
  ['src/view/popup.html', 'dist/view/popup.html'],
  ['src/view/popup.css', 'dist/view/popup.css'],
  ['src/view/components/KeywordList.css', 'dist/view/components/KeywordList.css'],
  ['src/view/components/KeyValueList.css', 'dist/view/components/KeyValueList.css'],
  ['src/view/components/ProfileManager.css', 'dist/view/components/ProfileManager.css'],
];

for (const [src, dest] of copies) {
  mkdirSync(dest.replace(/\/[^/]+$/, ''), { recursive: true });
  cpSync(src, dest);
}

cpSync('icons', 'dist/icons', { recursive: true });

const duration = (performance.now() - start).toFixed(2);
console.log(`Static files copied in ${duration}ms`);
