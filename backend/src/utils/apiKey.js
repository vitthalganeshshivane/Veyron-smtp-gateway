import crypto from 'crypto';

/**
 * Generate a new secure API Key
 * Returns full key (shown to user ONCE) and its SHA-256 hash (saved to DB)
 */
export function generateApiKey() {
  const prefix = crypto.randomBytes(6).toString('hex'); // 12 chars public identifier
  const secret = crypto.randomBytes(24).toString('hex'); // 48 chars secret entropy
  const apiKey = `vsg_live_${prefix}_${secret}`;
  const keyHash = hashApiKey(apiKey);

  return {
    apiKey,
    keyPrefix: `vsg_live_${prefix}`,
    keyHash
  };
}

/**
 * Compute SHA-256 hash of an API key
 * @param {string} key
 * @returns {string} Hex encoded hash
 */
export function hashApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
}
