import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const outputDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(projectRoot, 'keys');

fs.mkdirSync(outputDir, { recursive: true });

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(path.join(outputDir, 'license-priv.pem'), privateKey);
fs.writeFileSync(path.join(outputDir, 'license-pub.pem'), publicKey);

console.log(`Keys generated in ${outputDir}/`);
console.log('\nPublic key for .env:');
console.log(publicKey.trim());
console.log('\n⚠  KEEP PRIVATE KEY SECURE — it will sign licenses!');
