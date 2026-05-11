const outDir = process.env.OUTPUT_DIR || 'dist/chrome';

export default [
  {
    input: 'src/main.js',
    output: {
      file: `${outDir}/main.js`,
      format: 'iife',
      name: 'DandelionContentScript',
    },
  },
  {
    input: 'src/view/popup.js',
    output: {
      file: `${outDir}/view/popup.js`,
      format: 'iife',
      name: 'DandelionPopup',
    },
  },
  {
    input: 'src/view/page/index.js',
    output: {
      file: `${outDir}/view/page/index.js`,
      format: 'iife',
      name: 'DandelionConfigPage',
    },
  },
];
