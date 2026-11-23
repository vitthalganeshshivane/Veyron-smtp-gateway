import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { hashApiKey } from '../utils/apiKey.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to authenticate Admin users via JWT
 */
export async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or malformed Authorization header. Expected Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Look in User model first, fallback to Admin model
    let admin = await User.findById(decoded.id).select('-password');
    if (!admin) {
      admin = await Admin.findById(decoded.id).select('-password');
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Administrator privileges required'
      });
    }

    req.admin = admin;
    req.user = admin;
    next();
  } catch (error) {
    logger.debug({ error: error.message }, 'Admin authentication failed');
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token'
    });
  }
}

/**
 * Middleware for any authenticated user (admin or standard user)
 */
export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing Authorization header. Expected Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    let user = await User.findById(decoded.id).select('-password');
    if (!user) {
      user = await Admin.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    if (user.role === 'admin' || user.role === 'superadmin') {
      req.admin = user;
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to authenticate external email sending requests via Project or User API Key
 * Expected Header: Authorization: Bearer vsg_live_...
 */
export async function authenticateProject(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Project API key required in Authorization: Bearer <API_KEY>'
      });
    }

    const rawKey = authHeader.split(' ')[1];
    if (!rawKey.startsWith('vsg_live_')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    const keyHash = hashApiKey(rawKey);

    // 1. Check if key belongs to an approved User
    const user = await User.findOne({ keyHash });
    if (user) {
      if (user.status !== 'approved') {
        return res.status(403).json({
          success: false,
          error: `API key access is not active. Your account status is: "${user.status}". An administrator must approve your account before you can send emails.`
        });
      }

      // Update lastUsedAt asynchronously
      User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }).catch(() => {});

      req.project = {
        _id: user._id,
        name: user.name,
        dailyLimit: user.dailyLimit || 1000,
        monthlyLimit: user.monthlyLimit || 30000,
        rateLimitPerMinute: user.rateLimitPerMinute || 60,
        allowedSenders: [],
        allowedSmtpAccounts: [],
        isActive: true
      };
      req.user = user;
      return next();
    }

    // 2. Check if key belongs to a Project
    const project = await Project.findOne({ keyHash });
    if (project) {
      if (!project.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Project has been deactivated. Contact gateway administrator.'
        });
      }

      Project.updateOne({ _id: project._id }, { lastUsedAt: new Date() }).catch(() => {});
      req.project = project;
      return next();
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'API key authentication error');
    return res.status(500).json({
      success: false,
      error: 'Authentication verification error'
    });
  }
}
