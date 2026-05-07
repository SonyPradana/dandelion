export default [
  {
    input: 'src/main.js',
    output: {
      file: 'dist/main.js',
      format: 'iife',
      name: 'DandelionContentScript',
    },
  },
  {
    input: 'src/view/popup.js',
    output: {
      file: 'dist/view/popup.js',
      format: 'iife',
      name: 'DandelionPopup',
    },
  },
];
