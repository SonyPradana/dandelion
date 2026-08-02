import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.OUTPUT_DIR || 'dist/chrome';
const target = process.env.TARGET || 'chrome';
const alias = {
  '@bridge/browser': path.resolve(__dirname, `src/bridge/${target}.js`),
};

export default [
  {
    input: 'src/main.js',
    output: {
      file: `${outDir}/main.js`,
      format: 'iife',
      minify: {
        mangle: { toplevel: true },
        compress: true,
      },
    },
    resolve: { alias },
    transform: {
      define: {
        __DANDELION_HOST__: JSON.stringify(process.env.HOST || ''),
      },
    },
  },
  {
    input: {
      'view/popup': 'src/view/popup.js',
      'view/page/index': 'src/view/page/index.js',
    },
    output: {
      dir: outDir,
      format: 'es',
      minify: true,
      entryFileNames: '[name].js',
    },
    resolve: { alias },
  },
];
