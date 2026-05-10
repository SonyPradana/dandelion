import { rmSync } from 'fs';

const start = performance.now();
const target = process.argv[2];

if (!target) {
  console.error('Usage: node scripts/remove-static.js <path>');
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });

const duration = (performance.now() - start).toFixed(2);
console.log(`Removed ${target} in ${duration}ms`);
