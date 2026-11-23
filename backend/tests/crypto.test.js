import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/utils/encryption.js';
import { generateApiKey, hashApiKey } from '../src/utils/apiKey.js';

describe('Encryption Utility (AES-256-GCM)', () => {
  it('should encrypt and decrypt plaintext accurately', () => {
    const secret = 'SuperSecretSmtpPassword123!@#';
    const encrypted = encrypt(secret);

    expect(encrypted).not.toBe(secret);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('should throw an error if encrypted ciphertext is tampered with', () => {
    const secret = 'TamperTest';
    const encrypted = encrypt(secret);
    const parts = encrypted.split(':');
    // Tamper with the ciphertext byte
    parts[2] = 'ff' + parts[2].slice(2);
    const tampered = parts.join(':');

    expect(() => decrypt(tampered)).toThrow();
  });
});

describe('API Key Utility', () => {
  it('should generate valid API key with prefix and hash', () => {
    const { apiKey, keyPrefix, keyHash } = generateApiKey();

    expect(apiKey).toMatch(/^vsg_live_[0-9a-f]{12}_[0-9a-f]{48}$/);
    expect(keyPrefix).toMatch(/^vsg_live_[0-9a-f]{12}$/);
    expect(keyHash).toHaveLength(64); // SHA-256 hex string

    // Verifying consistent hashing
    expect(hashApiKey(apiKey)).toBe(keyHash);
  });

  it('different keys should generate distinct hashes', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();

    expect(key1.apiKey).not.toBe(key2.apiKey);
    expect(key1.keyHash).not.toBe(key2.keyHash);
  });
});
