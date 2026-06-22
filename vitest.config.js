import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@bridge/browser': path.resolve(__dirname, 'src/bridge/chrome.js'),
    },
  },
  test: {
    include: ['test/**/*.test.js'],
    setupFiles: ['test/setup.js'],
    environment: 'happy-dom',
    silent: true,
  },
});
