import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

// Derive a safe 32-byte key buffer from the master key
function getMasterKeyBuffer() {
  const master = env.ENCRYPTION_MASTER_KEY;
  if (!master) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not defined');
  }
  
  if (master.length === 64 && /^[0-9a-fA-F]+$/.test(master)) {
    return Buffer.from(master, 'hex');
  }
  
  // If not 64-character hex, hash it with SHA-256 to guarantee 32 bytes
  return crypto.createHash('sha256').update(master).digest();
}

/**
 * Encrypt plain text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} iv:authTag:ciphertext (all in hex)
 */
export function encrypt(text) {
  if (!text) return text;
  const key = getMasterKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt cipher text using AES-256-GCM
 * @param {string} cipherString - Formatted as iv:authTag:ciphertext
 * @returns {string} Decrypted plain text
 */
export function decrypt(cipherString) {
  if (!cipherString) return cipherString;
  const parts = cipherString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getMasterKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
