import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/main.js',
    output: {
      file: 'dist/main.js',
      format: 'iife',
      name: 'DandelionContentScript',
    },
    plugins: [resolve(), commonjs()],
  },
  {
    input: 'src/view/popup.js',
    output: {
      file: 'dist/view/popup.js',
      format: 'iife',
      name: 'DandelionPopup',
    },
    plugins: [resolve(), commonjs()],
  },
];
