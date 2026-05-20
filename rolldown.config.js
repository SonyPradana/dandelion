const outDir = process.env.OUTPUT_DIR || 'dist/chrome';

export default [
  {
    input: 'src/main.js',
    output: {
      file: `${outDir}/main.js`,
      format: 'iife',
      name: 'DandelionContentScript',
      minify: true,
    },
  },
  {
    input: 'src/view/popup.js',
    output: {
      file: `${outDir}/view/popup.js`,
      format: 'es',
      minify: true,
    },
  },
  {
    input: 'src/view/page/index.js',
    output: {
      file: `${outDir}/view/page/index.js`,
      format: 'iife',
      name: 'DandelionConfigPage',
      minify: true,
    },
  },
];
