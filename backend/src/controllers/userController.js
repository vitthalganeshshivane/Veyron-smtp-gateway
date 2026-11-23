import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { generateApiKey } from '../utils/apiKey.js';
import { logger } from '../utils/logger.js';

/**
 * List all registered users (Admin only)
 * GET /api/v1/users?status=pending
 */
export async function listUsers(req, res) {
  try {
    const { status, search } = req.query;
    const query = { role: 'user' };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const s = search.trim();
      query.$or = [
        { email: { $regex: s, $options: 'i' } },
        { name: { $regex: s, $options: 'i' } },
        { company: { $regex: s, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        name: u.name,
        company: u.company,
        status: u.status,
        apiKey: u.apiKey,
        keyPrefix: u.keyPrefix,
        dailyLimit: u.dailyLimit,
        monthlyLimit: u.monthlyLimit,
        rateLimitPerMinute: u.rateLimitPerMinute,
        approvedAt: u.approvedAt,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt
      }))
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error listing users');
    res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
}

/**
 * Approve a user and issue their API key
 * POST /api/v1/users/:id/approve
 */
export async function approveUser(req, res) {
  try {
    const { id } = req.params;
    const { dailyLimit, monthlyLimit, rateLimitPerMinute } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate API key for the user
    const { apiKey, keyPrefix, keyHash } = generateApiKey();

    user.status = 'approved';
    user.apiKey = apiKey;
    user.keyPrefix = keyPrefix;
    user.keyHash = keyHash;
    user.approvedAt = new Date();
    user.approvedBy = req.admin._id;

    if (dailyLimit !== undefined) user.dailyLimit = parseInt(dailyLimit, 10);
    if (monthlyLimit !== undefined) user.monthlyLimit = parseInt(monthlyLimit, 10);
    if (rateLimitPerMinute !== undefined) user.rateLimitPerMinute = parseInt(rateLimitPerMinute, 10);

    await user.save();

    // Also sync or create Project record for unified tracking
    await Project.findOneAndUpdate(
      { keyHash },
      {
        name: `${user.name} (${user.company || user.email})`,
        keyPrefix,
        keyHash,
        isActive: true,
        dailyLimit: user.dailyLimit,
        monthlyLimit: user.monthlyLimit,
        rateLimitPerMinute: user.rateLimitPerMinute
      },
      { upsert: true }
    );

    logger.info({ userId: user._id, email: user.email }, 'Admin approved user and issued API key');

    res.json({
      success: true,
      message: `User ${user.email} approved successfully. API Key has been issued.`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: user.status,
        apiKey: user.apiKey,
        dailyLimit: user.dailyLimit,
        monthlyLimit: user.monthlyLimit
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error approving user');
    res.status(500).json({ success: false, error: 'Failed to approve user' });
  }
}

/**
 * Reject or Suspend a user's access
 * POST /api/v1/users/:id/reject
 */
export async function rejectUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = 'rejected';
    // Revoke any active key hash
    if (user.keyHash) {
      await Project.deleteOne({ keyHash: user.keyHash });
      user.keyHash = '';
      user.apiKey = '';
    }
    await user.save();

    logger.warn({ userId: user._id, email: user.email }, 'Admin rejected user access');

    res.json({
      success: true,
      message: `User ${user.email} status set to rejected.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Revoke a user's API Key
 * POST /api/v1/users/:id/revoke
 */
export async function revokeUserKey(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.keyHash) {
      await Project.deleteOne({ keyHash: user.keyHash });
    }

    user.status = 'suspended';
    user.apiKey = '';
    user.keyHash = '';
    await user.save();

    logger.warn({ userId: user._id, email: user.email }, 'Admin revoked user API key and suspended access');

    res.json({
      success: true,
      message: `API Key for ${user.email} revoked and account suspended.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
