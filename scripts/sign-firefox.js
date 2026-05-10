import 'dotenv/config';
import { cmd } from 'web-ext';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

if (!process.env.AMO_JWT_ISSUER || !process.env.AMO_JWT_SECRET) {
  console.error(
    'AMO_JWT_ISSUER and AMO_JWT_SECRET must be set in .env to sign Firefox extension.',
  );
  console.error('Get API keys at: https://addons.mozilla.org/en-US/developers/addon/api/key/');
  process.exit(1);
}

console.log('Signing Firefox extension via AMO...');
cmd.sign(
  {
    sourceDir: path.join(root, 'dist', 'firefox'),
    apiKey: process.env.AMO_JWT_ISSUER,
    apiSecret: process.env.AMO_JWT_SECRET,
    channel: 'unlisted',
  },
  { shouldExitProgram: true },
);
