import * as jose from 'jose';

export async function generateTestKeys() {
  const { publicKey, privateKey } = await jose.generateKeyPair('EdDSA', { 
    crv: 'Ed25519',
    extractable: true 
  });
  const publicSpki = await jose.exportSPKI(publicKey);
  const privatePkcs8 = await jose.exportPKCS8(privateKey);
  return { publicSpki, privatePkcs8, publicKey, privateKey };
}

export async function createSignedTestLicense(
  privateKey: any,
  payload: {
    sub: string;
    tier: 'COMMUNITY' | 'PRO' | 'ENTERPRISE';
    tenants_limit?: number;
    accounts_limit?: number;
    features?: string[];
  },
  expiresIn: string = '30d'
) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}
