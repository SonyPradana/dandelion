import { cpSync, mkdirSync } from 'fs';

const start = performance.now();
const copies = [
  ['src/view/popup.html', 'dist/popup.html'],
  ['src/view/popup.css', 'dist/popup.css'],
  ['src/view/components/KeywordList.css', 'dist/components/KeywordList.css'],
  ['src/view/components/KeyValueList.css', 'dist/components/KeyValueList.css'],
];

for (const [src, dest] of copies) {
  mkdirSync(dest.replace(/\/[^/]+$/, ''), { recursive: true });
  cpSync(src, dest);
}

cpSync('icons', 'dist/icons', { recursive: true });

const duration = (performance.now() - start).toFixed(2);
console.log(`Static files copied in ${duration}ms`);
