import nodemailer from 'nodemailer';
import { decrypt } from '../utils/encryption.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Cache active transporters in memory by SMTPAccount _id or host+user key
const transporterCache = new Map();

/**
 * Known default settings for popular providers
 */
export const PROVIDER_PRESETS = {
  hostinger: {
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    securityMode: 'SSL/TLS'
  },
  google: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    securityMode: 'STARTTLS'
  }
};

/**
 * Creates or retrieves a cached Nodemailer transporter for an SMTP account document
 * @param {Object} smtpAccount - Mongoose document or plain object of SMTPAccount
 * @param {boolean} forceNew - If true, bypasses in-memory cache
 * @returns {nodemailer.Transporter}
 */
export function getOrCreateTransporter(smtpAccount, forceNew = false) {
  const accountId = smtpAccount._id ? smtpAccount._id.toString() : smtpAccount.name;

  if (!forceNew && transporterCache.has(accountId)) {
    return transporterCache.get(accountId);
  }

  // Handle mock mode for local testing without real credentials
  if (env.MOCK_SMTP_ENABLED || smtpAccount.isMock) {
    logger.debug({ accountId }, 'Initializing MOCK SMTP Transporter');
    const mockTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    transporterCache.set(accountId, mockTransporter);
    return mockTransporter;
  }

  // Decrypt password
  let password = '';
  try {
    password = decrypt(smtpAccount.encryptedPassword);
  } catch (err) {
    logger.error({ err: err.message, accountId }, 'Failed to decrypt SMTP credentials');
    throw new Error(`SMTP credential decryption failed: ${err.message}`);
  }

  const isSecure = smtpAccount.securityMode === 'SSL/TLS' || smtpAccount.port === 465;

  const transportOptions = {
    host: smtpAccount.host,
    port: smtpAccount.port,
    secure: isSecure,
    auth: {
      user: smtpAccount.username,
      pass: password
    },
    // Pool settings optimized for ~1GB RAM VM and provider rate limits
    pool: true,
    maxConnections: Math.min(Math.max(1, Math.floor(env.WORKER_CONCURRENCY / 2)), 5),
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: Math.max(1, Math.floor((smtpAccount.rateLimitPerMinute || 30) / 60)),
    connectionTimeout: smtpAccount.connectionTimeout || 10000,
    greetingTimeout: 10000,
    socketTimeout: smtpAccount.socketTimeout || 15000,
    tls: {
      rejectUnauthorized: env.NODE_ENV === 'production'
    }
  };

  const transporter = nodemailer.createTransport(transportOptions);
  transporterCache.set(accountId, transporter);

  return transporter;
}

/**
 * Creates a Nodemailer transporter on the fly for dynamic / request-supplied credentials
 * @param {Object} dynamicConfig - { host, port, secure, securityMode, auth: { user, pass }, tls }
 * @returns {nodemailer.Transporter}
 */
export function createDynamicTransporter(dynamicConfig) {
  if (env.MOCK_SMTP_ENABLED) {
    logger.debug('MOCK_SMTP_ENABLED is true; returning mock transporter for dynamic request');
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const port = parseInt(dynamicConfig.port || 587, 10);
  const isSecure = dynamicConfig.secure !== undefined
    ? dynamicConfig.secure
    : (dynamicConfig.securityMode === 'SSL/TLS' || port === 465);

  const transportOptions = {
    host: dynamicConfig.host,
    port: port,
    secure: isSecure,
    auth: {
      user: dynamicConfig.auth.user,
      pass: dynamicConfig.auth.pass
    },
    pool: false, // Ephemeral on-the-fly transport
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: dynamicConfig.tls || {
      rejectUnauthorized: env.NODE_ENV === 'production'
    }
  };

  return nodemailer.createTransport(transportOptions);
}

/**
 * Invalidate cached transporter when an SMTP account is updated or paused
 * @param {string} accountId
 */
export function invalidateTransporter(accountId) {
  if (transporterCache.has(accountId)) {
    const transporter = transporterCache.get(accountId);
    try {
      transporter.close();
    } catch {
      // Ignore close error
    }
    transporterCache.delete(accountId);
    logger.debug({ accountId }, 'Invalidated cached SMTP transporter');
  }
}

/**
 * Verify SMTP connection and credentials
 * @param {Object} smtpAccount
 * @returns {Promise<{ success: boolean, message?: string, error?: string }>}
 */
export async function verifySmtpConnection(smtpAccount) {
  if (env.MOCK_SMTP_ENABLED || smtpAccount.isMock) {
    return { success: true, message: 'Mock SMTP Transport verified successfully' };
  }

  let transporter;
  try {
    transporter = getOrCreateTransporter(smtpAccount, true);
    await transporter.verify();
    return {
      success: true,
      message: `Successfully connected and authenticated with ${smtpAccount.host}:${smtpAccount.port}`
    };
  } catch (error) {
    logger.warn({ error: error.message, account: smtpAccount.name }, 'SMTP connection verification failed');
    return {
      success: false,
      error: error.message || 'SMTP Connection verification failed'
    };
  }
}

/**
 * Verify dynamic credentials on the fly
 */
export async function verifyDynamicSmtp(dynamicConfig) {
  if (env.MOCK_SMTP_ENABLED) {
    return { success: true, message: 'Mock dynamic SMTP connection verified successfully' };
  }

  try {
    const transporter = createDynamicTransporter(dynamicConfig);
    await transporter.verify();
    return {
      success: true,
      message: `Successfully connected and authenticated with ${dynamicConfig.host}:${dynamicConfig.port}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Dynamic SMTP verification failed'
    };
  }
}

/**
 * Classifies SMTP errors into transient (retryable) vs permanent (non-retryable)
 * @param {Error} error
 * @returns {{ isPermanent: boolean, isAuthFailure: boolean, reason: string }}
 */
export function classifySmtpError(error) {
  const message = (error.message || '').toLowerCase();
  const response = (error.response || '').toLowerCase();
  const code = (error.code || '').toUpperCase();
  const responseCode = error.responseCode;

  // 1. Authentication failure (535, EAUTH) - Permanent & requires admin alert
  if (responseCode === 535 || code === 'EAUTH' || message.includes('invalid credentials') || message.includes('username and password not accepted')) {
    return {
      isPermanent: true,
      isAuthFailure: true,
      reason: 'Authentication failed. Check username and password / app password.'
    };
  }

  // 2. Permanent SMTP 5xx errors (e.g. 550 Mailbox not found, 553, 501 syntax error)
  if (responseCode && responseCode >= 500 && responseCode < 600) {
    return {
      isPermanent: true,
      isAuthFailure: false,
      reason: `Permanent SMTP 5xx error: ${error.response || error.message}`
    };
  }

  // 3. Transient / Retryable errors:
  const transientCodes = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ESOCKET', 'ENOTFOUND', 'EAI_AGAIN'];
  if (transientCodes.includes(code) || (responseCode && responseCode >= 400 && responseCode < 500)) {
    return {
      isPermanent: false,
      isAuthFailure: false,
      reason: `Transient SMTP failure: ${error.message || error.response || code}`
    };
  }

  return {
    isPermanent: false,
    isAuthFailure: false,
    reason: `Unclassified error: ${error.message}`
  };
}
