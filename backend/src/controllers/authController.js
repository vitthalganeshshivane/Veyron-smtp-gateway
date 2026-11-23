import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Admin } from '../models/Admin.js';
import { env } from '../config/env.js';
import { generateApiKey } from '../utils/apiKey.js';
import { logger } from '../utils/logger.js';

/**
 * User Registration (Self-service signup)
 * POST /api/v1/auth/register
 */
export async function register(req, res) {
  try {
    const { email, password, name, company } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Create user with 'pending' status waiting for admin approval
    const user = await User.create({
      email: normalizedEmail,
      password,
      name: name.trim(),
      company: company ? company.trim() : '',
      role: 'user',
      status: 'pending', // Awaiting admin approval
      dailyLimit: 1000,
      monthlyLimit: 30000,
      rateLimitPerMinute: 60
    });

    logger.info({ userId: user._id, email: user.email }, 'New user registered - pending admin approval');

    // Generate JWT so user can view their pending status in the dashboard
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Your API key access is currently pending administrator approval.',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    logger.error({ err: err.message }, 'User registration error');
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
}

/**
 * Universal Login (Admin or User)
 * POST /api/v1/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check in User model
    let user = await User.findOne({ email: normalizedEmail });
    let isMatch = false;

    if (user) {
      isMatch = await user.comparePassword(password);
    } else {
      // Fallback check in Admin model
      user = await Admin.findOne({ email: normalizedEmail });
      if (user) {
        isMatch = await user.comparePassword(password);
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || 'user' },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        status: user.status || 'approved',
        apiKey: user.apiKey || '',
        dailyLimit: user.dailyLimit || 1000,
        monthlyLimit: user.monthlyLimit || 30000,
        rateLimitPerMinute: user.rateLimitPerMinute || 60,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Login error');
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}

export async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req, res) {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      company: user.company || '',
      role: user.role,
      status: user.status || 'approved',
      apiKey: user.apiKey || '',
      keyPrefix: user.keyPrefix || '',
      dailyLimit: user.dailyLimit || 1000,
      monthlyLimit: user.monthlyLimit || 30000,
      rateLimitPerMinute: user.rateLimitPerMinute || 60,
      approvedAt: user.approvedAt,
      lastLoginAt: user.lastLoginAt
    }
  });
}

/**
 * Regenerate API Key for an Approved User
 * POST /api/v1/auth/regenerate-my-key
 */
export async function regenerateMyKey(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Only approved accounts can generate or regenerate API keys'
      });
    }

    const { apiKey, keyPrefix, keyHash } = generateApiKey();
    user.apiKey = apiKey;
    user.keyPrefix = keyPrefix;
    user.keyHash = keyHash;
    await user.save();

    logger.info({ userId: user._id }, 'User regenerated their personal API key');

    res.json({
      success: true,
      message: 'New API key generated successfully',
      apiKey
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password (min 8 characters) are required'
      });
    }

    let user = await User.findById(req.user._id);
    if (!user) {
      user = await Admin.findById(req.user._id);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password does not match' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    logger.error({ err: err.message }, 'Change password error');
    res.status(500).json({ success: false, error: 'Failed to update password' });
  }
}

/**
 * Bootstrap the initial master admin user
 */
export async function seedInitialAdmin() {
  try {
    const email = env.ADMIN_INITIAL_EMAIL.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (!existing) {
      const { apiKey, keyPrefix, keyHash } = generateApiKey();
      await User.create({
        email,
        password: env.ADMIN_INITIAL_PASSWORD,
        name: 'Master Administrator',
        role: 'superadmin',
        status: 'approved',
        apiKey,
        keyPrefix,
        keyHash,
        dailyLimit: 100000,
        monthlyLimit: 1000000,
        approvedAt: new Date()
      });
      logger.info({ email }, 'Bootstrapped initial master admin user successfully in User collection');
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to seed initial admin');
  }
}
