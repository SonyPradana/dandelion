import { existsSync } from 'fs';
import { config } from '@dotenvx/dotenvx';

function fail(messages) {
  for (const message of messages) console.error(message);
  process.exit(1);
}

const hasProduction = existsSync('.env.production');
const hasLocal = existsSync('.env');

if (!hasProduction && !hasLocal) {
  fail([
    'No env file found (looked for .env.production and .env).',
    'Contributors: create your own env from the template:',
    '  cp .env.example .env',
    'Owner: restore .env.production and .env.keys from your password manager.',
  ]);
}

const production = config({
  path: '.env.production',
  ignore: ['MISSING_ENV_FILE'],
  quiet: true,
});

config({
  path: '.env',
  ignore: ['MISSING_ENV_FILE'],
  quiet: true,
  overload: true,
});

const undecrypted = Object.keys(production.parsed || {}).filter((key) => {
  const value = process.env[key];
  return typeof value === 'string' && value.startsWith('encrypted:');
});

if (undecrypted.length > 0) {
  fail([
    `Failed to decrypt ${undecrypted.length} value(s) in .env.production: ${undecrypted.join(', ')}`,
    'Owner: make sure .env.keys holds the matching DOTENV_PRIVATE_KEY_PRODUCTION.',
    'Contributors: do not rely on .env.production — create your own env instead:',
    '  cp .env.example .env',
  ]);
}
