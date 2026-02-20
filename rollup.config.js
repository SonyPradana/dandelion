import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv';

dotenv.config();

const plugins = [
  resolve(),
  commonjs(),
  replace({
    'process.env.DAILY_LIMIT': JSON.stringify(process.env.DAILY_LIMIT || '100'),
    preventAssignment: true
  })
];

export default [
  {
    input: 'src/main.js',
    output: {
      file: 'dist/main.js',
      format: 'iife',
      name: 'DandelionContentScript',
    },
    plugins,
  },
  {
    input: 'src/view/popup.js',
    output: {
      file: 'dist/view/popup.js',
      format: 'iife',
      name: 'DandelionPopup',
    },
    plugins,
  },
];
