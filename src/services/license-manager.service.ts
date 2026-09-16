import * as jose from 'jose';
import type { LicenseClaims, LicenseTier } from '../core/types/license.types.js';

// Default Master Public Key (Ed25519) for verification
export const DEFAULT_PUBLIC_KEY_SPKI = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEANkU1bVpCZXFwOGJ4Y1p5MmN6WDFkVGNpY09GZ1Z0TXh5dXZ3
-----END PUBLIC KEY-----`;

export class LicenseManagerService {
  private currentTier: LicenseTier = 'COMMUNITY';
  private claims: LicenseClaims | null = null;
  private publicKeySpki: string;

  constructor(publicKeySpki?: string) {
    this.publicKeySpki = publicKeySpki || DEFAULT_PUBLIC_KEY_SPKI;
  }

  public async verifyLicense(licenseKey?: string): Promise<{ tier: LicenseTier; claims: LicenseClaims | null }> {
    if (!licenseKey || licenseKey.trim() === '') {
      this.currentTier = 'COMMUNITY';
      this.claims = null;
      return { tier: 'COMMUNITY', claims: null };
    }

    try {
      const publicKey = await jose.importSPKI(this.publicKeySpki, 'EdDSA');
      const { payload } = await jose.jwtVerify(licenseKey, publicKey);

      const claims = payload as unknown as LicenseClaims;
      this.claims = claims;
      this.currentTier = claims.tier || 'COMMUNITY';

      return { tier: this.currentTier, claims: this.claims };
    } catch (err) {
      console.warn('⚠️ Invalid or expired license key. Falling back gracefully to COMMUNITY tier.');
      this.currentTier = 'COMMUNITY';
      this.claims = null;
      return { tier: 'COMMUNITY', claims: null };
    }
  }

  public getTier(): LicenseTier {
    return this.currentTier;
  }

  public getClaims(): LicenseClaims | null {
    return this.claims;
  }
}
