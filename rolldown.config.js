const outDir = process.env.OUTPUT_DIR || 'dist/chrome';

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
  },
];
