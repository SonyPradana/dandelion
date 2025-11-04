import neostandard from 'neostandard';
import globals from 'globals';

export default [
  ...neostandard(),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        browser: true,
      },
    },
  },
  {
    rules: {
      '@stylistic/semi': ['error', 'always']
    },
  },
  {
    ignores: ['dist', 'vendor', 'node_modules', '.output'],
  },
];
