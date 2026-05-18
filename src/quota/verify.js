import { jwtVerify, importSPKI } from 'jose';
import { PUBLIC_KEY } from './public-key.js';

export async function verifyLicense(jwtString) {
  try {
    const publicKey = await importSPKI(PUBLIC_KEY, 'ES256');
    const { payload } = await jwtVerify(jwtString, publicKey, {
      issuer: 'Dandelion',
      audience: 'dandelion-extension',
    });
    return payload;
  } catch (error) {
    console.warn('[License] Verification failed:', error?.code || error?.message || error);
    return null;
  }
}
