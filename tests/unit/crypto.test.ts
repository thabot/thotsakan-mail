import { describe, expect, it } from 'bun:test';
import { CryptoService } from '../../src/services/crypto.service.js';

describe('CryptoService (AES-256-GCM)', () => {
  const hexKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const crypto = new CryptoService(hexKey);

  it('should encrypt and decrypt a plain text correctly', () => {
    const originalText = 'SuperSecretPassword123!@#';
    const encrypted = crypto.encrypt(originalText);

    expect(encrypted).not.toBe(originalText);
    expect(encrypted.split(':').length).toBe(3); // iv:tag:data

    const decrypted = crypto.decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should fail decryption if wrong key is used', () => {
    const wrongKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
    const wrongCrypto = new CryptoService(wrongKey);

    const originalText = 'ConfidentialToken';
    const encrypted = crypto.encrypt(originalText);

    expect(() => wrongCrypto.decrypt(encrypted)).toThrow();
  });

  it('should fail if cipher text format is tampered with', () => {
    expect(() => crypto.decrypt('tampered-cipher-text')).toThrow();
  });

  it('should validate key length strictly to 32 bytes (64 hex characters)', () => {
    expect(() => new CryptoService('short-key')).toThrow();
  });
});
