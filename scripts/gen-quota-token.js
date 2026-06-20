import { SignJWT, importPKCS8 } from 'jose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const args = {};
const raw = process.argv.slice(2);
for (let i = 0; i < raw.length; i++) {
  const key = raw[i].replace(/^--?/, '');
  const val = raw[++i];
  if (key === 'k' || key === 'private-key') args.privateKey = val;
  if (key === 'e' || key === 'expiry') args.expiry = val;
  if (key === 'p' || key === 'point' || key === 'token') args.totalLimit = parseInt(val, 10) || 0;
  if (key === 'd' || key === 'daily-limit') args.dailyLimit = parseInt(val, 10) || 100;
  if (key === 'version-allowed') args.versionAllowed = val;
  if (key === 'features') args.features = val;
  if (key === 'token-id' || key === 'license-id') args.licenseId = val;
}

if (!args.privateKey || !args.expiry) {
  console.error(
    'Usage: bun scripts/gen-quota-token.js -k <private-key.pem> -e <expiry> -p <total_limit>',
  );
  console.error('  -k, --private-key      Path to ES256 private key PEM (required)');
  console.error('  -e, --expiry           Duration: 7d, 12m, 1y, or date (required)');
  console.error('  -p, --point, --token   Total limit (default: 0 = unlimited)');
  console.error('  -d, --daily-limit      Grace daily limit after total exhausted (default: 100)');
  console.error('  --version-allowed      Comma-separated version list (e.g. "1.*")');
  console.error('  --features             Comma-separated feature names');
  console.error('  --token-id             Custom token ID (default: auto-generated)');
  console.error('');
  console.error('Examples:');
  console.error(
    '  bun scripts/gen-quota-token.js -k keys/license-priv.pem -e 7d -p 30000 --version-allowed "1.*" --token-id aB3xK9mQ',
  );
  console.error(
    '  bun scripts/gen-quota-token.js -k keys/license-priv.pem -e 12m -p 0 -d 200 --features skriningform --token-id X7pL2nR8',
  );
  process.exit(1);
}

function parseExpiry(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value);
  }
  const match = value.match(/^(\d+)(d|m|y)$/);
  if (!match) throw new Error(`Invalid expiry format: ${value}. Use: 90d, 12m, 1y, or 2027-01-01`);
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();
  if (unit === 'd') now.setDate(now.getDate() + num);
  if (unit === 'm') now.setMonth(now.getMonth() + num);
  if (unit === 'y') now.setFullYear(now.getFullYear() + num);
  return now;
}

const privateKeyPEM = fs.readFileSync(path.resolve(args.privateKey), 'utf8');

const licenseId = args.licenseId || `lic_${crypto.randomUUID().slice(0, 8)}`;
const features = args.features
  ? args.features
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : ['skriningform', 'skrining', 'skrining-form-not-checked', 'zen-mode'];
const versionAllowed = args.versionAllowed
  ? args.versionAllowed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : ['*'];

const privateKey = await importPKCS8(privateKeyPEM, 'ES256');

const jwt = await new SignJWT({
  license_id: licenseId,
  features,
  total_limit: args.totalLimit || 0,
  daily_limit: args.dailyLimit || 100,
  version_allowed: versionAllowed,
})
  .setProtectedHeader({ alg: 'ES256' })
  .setIssuer('Dandelion')
  .setAudience('dandelion-extension')
  .setSubject('license')
  .setIssuedAt()
  .setExpirationTime(parseExpiry(args.expiry))
  .sign(privateKey);

console.log(jwt);
console.error(`\nToken ID        : ${licenseId}`);
console.error(`Features        : ${features.join(', ')}`);
console.error(`Total limit     : ${args.totalLimit || 0} (0 = unlimited)`);
console.error(`Daily limit     : ${args.dailyLimit || 100}`);
console.error(`Version allowed : ${versionAllowed.join(', ') || '(all)'}`);
console.error(`Expires         : ${parseExpiry(args.expiry).toISOString()}`);
