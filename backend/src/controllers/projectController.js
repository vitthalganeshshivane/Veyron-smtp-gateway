import { Project } from '../models/Project.js';
import { EmailQuota } from '../models/EmailQuota.js';
import { generateApiKey } from '../utils/apiKey.js';
import { logger } from '../utils/logger.js';

/**
 * List all projects with today's quota usage summary
 * GET /api/v1/projects
 */
export async function listProjects(req, res) {
  try {
    const projects = await Project.find()
      .populate('allowedSmtpAccounts', 'name providerType fromEmail')
      .sort({ createdAt: -1 });

    const todayKey = new Date().toISOString().slice(0, 10);
    const projectIds = projects.map(p => p._id);

    const quotas = await EmailQuota.find({
      targetType: 'project',
      targetId: { $in: projectIds },
      period: 'daily',
      dateKey: todayKey
    });

    const quotaMap = new Map();
    quotas.forEach(q => {
      quotaMap.set(q.targetId.toString(), {
        sent: q.sent || 0,
        reserved: q.reserved || 0,
        failed: q.failed || 0
      });
    });

    const enriched = projects.map(p => {
      const q = quotaMap.get(p._id.toString()) || { sent: 0, reserved: 0, failed: 0 };
      return {
        ...p.toJSON(),
        todayUsage: q
      };
    });

    res.json({ success: true, projects: enriched });
  } catch (err) {
    logger.error({ err: err.message }, 'Error listing projects');
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
}

/**
 * Create a new Project and generate initial API Key
 * POST /api/v1/projects
 */
export async function createProject(req, res) {
  try {
    const { name, description, dailyLimit, monthlyLimit, rateLimitPerMinute, allowedSmtpAccounts, allowedSenders } = req.body;

    const existing = await Project.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: `Project named "${name}" already exists` });
    }

    const { apiKey, keyPrefix, keyHash } = generateApiKey();

    const project = await Project.create({
      name: name.trim(),
      description: description || '',
      keyPrefix,
      keyHash,
      dailyLimit: dailyLimit || 1000,
      monthlyLimit: monthlyLimit || 30000,
      rateLimitPerMinute: rateLimitPerMinute || 60,
      allowedSmtpAccounts: allowedSmtpAccounts || [],
      allowedSenders: allowedSenders || []
    });

    logger.info({ projectId: project._id, name: project.name }, 'New project registered with API Key');

    // Return the plaintext API Key ONLY ONCE!
    res.status(201).json({
      success: true,
      message: 'Project created successfully. Save your API key securely; it will not be shown again.',
      project: project.toJSON(),
      apiKey // ONLY SHOWN HERE
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error creating project');
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
}

/**
 * Get Project Details by ID
 * GET /api/v1/projects/:id
 */
export async function getProject(req, res) {
  try {
    const project = await Project.findById(req.params.id)
      .populate('allowedSmtpAccounts', 'name providerType fromEmail isActive');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, project: project.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve project' });
  }
}

/**
 * Update Project Details
 * PUT /api/v1/projects/:id
 */
export async function updateProject(req, res) {
  try {
    const { name, description, isActive, dailyLimit, monthlyLimit, rateLimitPerMinute, allowedSmtpAccounts, allowedSenders } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (isActive !== undefined) project.isActive = isActive;
    if (dailyLimit !== undefined) project.dailyLimit = dailyLimit;
    if (monthlyLimit !== undefined) project.monthlyLimit = monthlyLimit;
    if (rateLimitPerMinute !== undefined) project.rateLimitPerMinute = rateLimitPerMinute;
    if (allowedSmtpAccounts !== undefined) project.allowedSmtpAccounts = allowedSmtpAccounts;
    if (allowedSenders !== undefined) project.allowedSenders = allowedSenders;

    await project.save();

    res.json({ success: true, message: 'Project updated successfully', project: project.toJSON() });
  } catch (err) {
    logger.error({ err: err.message }, 'Error updating project');
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
}

/**
 * Regenerate API Key for a Project
 * POST /api/v1/projects/:id/regenerate-key
 */
export async function regenerateApiKey(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const { apiKey, keyPrefix, keyHash } = generateApiKey();

    project.keyPrefix = keyPrefix;
    project.keyHash = keyHash;
    await project.save();

    logger.warn({ projectId: project._id, name: project.name }, 'API key regenerated for project');

    res.json({
      success: true,
      message: 'New API key generated. The previous key is now revoked immediately.',
      apiKey // Displayed ONLY ONCE
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error regenerating API key');
    res.status(500).json({ success: false, error: 'Failed to regenerate API key' });
  }
}

/**
 * Delete a Project
 * DELETE /api/v1/projects/:id
 */
export async function deleteProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    await Project.deleteOne({ _id: project._id });
    logger.info({ projectId: project._id, name: project.name }, 'Project deleted');

    res.json({ success: true, message: `Project ${project.name} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
}
