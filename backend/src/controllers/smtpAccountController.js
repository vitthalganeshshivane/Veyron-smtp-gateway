import { SMTPAccount } from '../models/SMTPAccount.js';
import { encrypt } from '../utils/encryption.js';
import {
  verifySmtpConnection,
  invalidateTransporter
} from '../providers/smtpTransportFactory.js';
import { logger } from '../utils/logger.js';

/**
 * List all SMTP Accounts
 * GET /api/v1/smtp-accounts
 */
export async function listAccounts(req, res) {
  try {
    const accounts = await SMTPAccount.find()
      .populate('assignedProjects', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, accounts });
  } catch (err) {
    logger.error({ err: err.message }, 'Error listing SMTP accounts');
    res.status(500).json({ success: false, error: 'Failed to retrieve SMTP accounts' });
  }
}

/**
 * Create a new SMTP Account
 * POST /api/v1/smtp-accounts
 */
export async function createAccount(req, res) {
  try {
    const {
      name,
      providerType,
      host,
      port,
      username,
      password,
      securityMode,
      fromEmail,
      fromName,
      dailyLimit,
      monthlyLimit,
      rateLimitPerMinute,
      connectionTimeout,
      socketTimeout,
      assignedProjects
    } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'SMTP password is required on account creation' });
    }

    const existing = await SMTPAccount.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: `Account with name "${name}" already exists` });
    }

    // Encrypt password at rest using AES-256-GCM
    const encryptedPassword = encrypt(password);

    const account = new SMTPAccount({
      name: name.trim(),
      providerType: providerType || 'custom',
      host: host.trim(),
      port: parseInt(port, 10),
      username: username.trim(),
      encryptedPassword,
      securityMode: securityMode || 'STARTTLS',
      fromEmail: fromEmail.toLowerCase().trim(),
      fromName: fromName || 'Veyron Gateway',
      dailyLimit: dailyLimit || 500,
      monthlyLimit: monthlyLimit || 15000,
      rateLimitPerMinute: rateLimitPerMinute || 30,
      connectionTimeout: connectionTimeout || 10000,
      socketTimeout: socketTimeout || 15000,
      assignedProjects: assignedProjects || []
    });

    // Verify connection upfront if not mock
    const verification = await verifySmtpConnection(account);
    account.verificationStatus = verification.success ? 'verified' : 'failed';
    account.lastVerifiedAt = new Date();
    account.lastVerificationError = verification.error || '';

    await account.save();

    logger.info({ accountId: account._id, name: account.name }, 'SMTP account registered successfully');

    res.status(201).json({
      success: true,
      message: 'SMTP Account created successfully',
      account: account.toJSON(),
      verification
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error creating SMTP account');
    res.status(500).json({ success: false, error: `Failed to create SMTP account: ${err.message}` });
  }
}

/**
 * Get single SMTP Account
 * GET /api/v1/smtp-accounts/:id
 */
export async function getAccount(req, res) {
  try {
    const account = await SMTPAccount.findById(req.params.id)
      .populate('assignedProjects', 'name');

    if (!account) {
      return res.status(404).json({ success: false, error: 'SMTP account not found' });
    }

    res.json({ success: true, account: account.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve SMTP account' });
  }
}

/**
 * Update an existing SMTP Account
 * PUT /api/v1/smtp-accounts/:id
 */
export async function updateAccount(req, res) {
  try {
    const {
      name,
      providerType,
      host,
      port,
      username,
      password,
      securityMode,
      fromEmail,
      fromName,
      dailyLimit,
      monthlyLimit,
      rateLimitPerMinute,
      isActive,
      isPaused,
      connectionTimeout,
      socketTimeout,
      assignedProjects
    } = req.body;

    const account = await SMTPAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'SMTP account not found' });
    }

    if (name) account.name = name.trim();
    if (providerType) account.providerType = providerType;
    if (host) account.host = host.trim();
    if (port) account.port = parseInt(port, 10);
    if (username) account.username = username.trim();
    if (securityMode) account.securityMode = securityMode;
    if (fromEmail) account.fromEmail = fromEmail.toLowerCase().trim();
    if (fromName !== undefined) account.fromName = fromName;
    if (dailyLimit !== undefined) account.dailyLimit = dailyLimit;
    if (monthlyLimit !== undefined) account.monthlyLimit = monthlyLimit;
    if (rateLimitPerMinute !== undefined) account.rateLimitPerMinute = rateLimitPerMinute;
    if (isActive !== undefined) account.isActive = isActive;
    if (isPaused !== undefined) {
      account.isPaused = isPaused;
      if (!isPaused) account.pauseReason = '';
    }
    if (connectionTimeout !== undefined) account.connectionTimeout = connectionTimeout;
    if (socketTimeout !== undefined) account.socketTimeout = socketTimeout;
    if (assignedProjects !== undefined) account.assignedProjects = assignedProjects;

    // If new password provided, encrypt and update
    if (password && password.trim()) {
      account.encryptedPassword = encrypt(password.trim());
      // Invalidate connection cache so new credentials take effect
      invalidateTransporter(account._id.toString());
    }

    await account.save();

    res.json({
      success: true,
      message: 'SMTP account updated successfully',
      account: account.toJSON()
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error updating SMTP account');
    res.status(500).json({ success: false, error: 'Failed to update SMTP account' });
  }
}

/**
 * Test Connection for an SMTP Account
 * POST /api/v1/smtp-accounts/:id/test
 */
export async function testAccountConnection(req, res) {
  try {
    const account = await SMTPAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'SMTP account not found' });
    }

    // Force refresh transporter cache
    invalidateTransporter(account._id.toString());

    const result = await verifySmtpConnection(account);

    account.lastVerifiedAt = new Date();
    account.verificationStatus = result.success ? 'verified' : 'failed';
    account.lastVerificationError = result.error || '';
    if (result.success && account.isPaused) {
      // If was paused due to auth and now verified, unpause
      account.isPaused = false;
      account.pauseReason = '';
    }
    await account.save();

    res.json({
      success: result.success,
      message: result.message || 'Connection test completed',
      error: result.error
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error testing SMTP connection');
    res.status(500).json({ success: false, error: `Connection test error: ${err.message}` });
  }
}

/**
 * Delete an SMTP Account
 * DELETE /api/v1/smtp-accounts/:id
 */
export async function deleteAccount(req, res) {
  try {
    const account = await SMTPAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'SMTP account not found' });
    }

    invalidateTransporter(account._id.toString());
    await SMTPAccount.deleteOne({ _id: account._id });

    logger.info({ accountId: account._id, name: account.name }, 'SMTP account deleted');

    res.json({ success: true, message: `SMTP account "${account.name}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete SMTP account' });
  }
}
