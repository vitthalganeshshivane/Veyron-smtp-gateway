import { EmailQuota } from '../models/EmailQuota.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { SMTPAccount } from '../models/SMTPAccount.js';
import { logger } from '../utils/logger.js';

function getTodayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function getMonthKey() {
  const now = new Date();
  return now.toISOString().slice(0, 7); // 'YYYY-MM'
}

/**
 * Checks and atomically reserves quota for a project and an SMTP account
 * @param {string} projectId
 * @param {string} smtpAccountId
 * @param {number} count - Number of recipients to send to
 * @returns {Promise<{ allowed: boolean, reason?: string }>}
 */
export async function reserveQuota(projectId, smtpAccountId, count = 1) {
  const todayKey = getTodayKey();
  const monthKey = getMonthKey();

  // 1. Fetch Project limits (or Approved User limits)
  let project = await Project.findById(projectId);
  if (!project) {
    const user = await User.findById(projectId);
    if (user && user.status === 'approved') {
      project = {
        _id: user._id,
        name: user.name,
        isActive: true,
        dailyLimit: user.dailyLimit || 1000,
        monthlyLimit: user.monthlyLimit || 30000,
        rateLimitPerMinute: user.rateLimitPerMinute || 60
      };
    }
  }

  if (!project || !project.isActive) {
    return { allowed: false, reason: 'Project is inactive or not found' };
  }

  // Check project daily quota
  const projectDaily = await EmailQuota.findOneAndUpdate(
    { targetType: 'project', targetId: projectId, period: 'daily', dateKey: todayKey },
    { $setOnInsert: { sent: 0, failed: 0 } },
    { upsert: true, new: true }
  );

  if ((projectDaily.sent + projectDaily.reserved + count) > project.dailyLimit) {
    return {
      allowed: false,
      reason: `Project daily quota exceeded (${projectDaily.sent + projectDaily.reserved}/${project.dailyLimit})`
    };
  }

  // Check project monthly quota
  const projectMonthly = await EmailQuota.findOneAndUpdate(
    { targetType: 'project', targetId: projectId, period: 'monthly', dateKey: monthKey },
    { $setOnInsert: { sent: 0, failed: 0 } },
    { upsert: true, new: true }
  );

  if ((projectMonthly.sent + projectMonthly.reserved + count) > project.monthlyLimit) {
    return {
      allowed: false,
      reason: `Project monthly quota exceeded (${projectMonthly.sent + projectMonthly.reserved}/${project.monthlyLimit})`
    };
  }

  // 2. Fetch SMTP Account limits (if an account is selected upfront)
  if (smtpAccountId) {
    const account = await SMTPAccount.findById(smtpAccountId);
    if (!account || !account.isActive || account.isPaused) {
      return { allowed: false, reason: 'Selected SMTP Account is inactive or paused' };
    }

    const accountDaily = await EmailQuota.findOneAndUpdate(
      { targetType: 'smtp_account', targetId: smtpAccountId, period: 'daily', dateKey: todayKey },
      { $setOnInsert: { sent: 0, failed: 0 } },
      { upsert: true, new: true }
    );

    if ((accountDaily.sent + accountDaily.reserved + count) > account.dailyLimit) {
      return {
        allowed: false,
        reason: `SMTP Account daily quota exceeded (${accountDaily.sent + accountDaily.reserved}/${account.dailyLimit})`
      };
    }

    // Atomically increment reserved count for SMTP Account
    await EmailQuota.updateOne(
      { _id: accountDaily._id },
      { $inc: { reserved: count } }
    );
  }

  // Atomically increment reserved count for Project
  await EmailQuota.updateOne({ _id: projectDaily._id }, { $inc: { reserved: count } });
  await EmailQuota.updateOne({ _id: projectMonthly._id }, { $inc: { reserved: count } });

  return { allowed: true };
}

/**
 * Reconcile quota after an email succeeds
 */
export async function recordQuotaSuccess(projectId, smtpAccountId, count = 1) {
  const todayKey = getTodayKey();
  const monthKey = getMonthKey();

  try {
    // Project reconciliation
    await Promise.all([
      EmailQuota.updateOne(
        { targetType: 'project', targetId: projectId, period: 'daily', dateKey: todayKey },
        { $inc: { reserved: -count, sent: count } }
      ),
      EmailQuota.updateOne(
        { targetType: 'project', targetId: projectId, period: 'monthly', dateKey: monthKey },
        { $inc: { reserved: -count, sent: count } }
      )
    ]);

    // SMTP account reconciliation
    if (smtpAccountId) {
      await Promise.all([
        EmailQuota.updateOne(
          { targetType: 'smtp_account', targetId: smtpAccountId, period: 'daily', dateKey: todayKey },
          { $inc: { reserved: -count, sent: count } }
        ),
        EmailQuota.updateOne(
          { targetType: 'smtp_account', targetId: smtpAccountId, period: 'monthly', dateKey: monthKey },
          { $inc: { reserved: -count, sent: count } }
        )
      ]);
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to reconcile quota on success');
  }
}

/**
 * Reconcile quota after an email permanently fails
 */
export async function recordQuotaFailure(projectId, smtpAccountId, count = 1) {
  const todayKey = getTodayKey();
  const monthKey = getMonthKey();

  try {
    // Release reserved quota and mark failed
    await Promise.all([
      EmailQuota.updateOne(
        { targetType: 'project', targetId: projectId, period: 'daily', dateKey: todayKey },
        { $inc: { reserved: -count, failed: count } }
      ),
      EmailQuota.updateOne(
        { targetType: 'project', targetId: projectId, period: 'monthly', dateKey: monthKey },
        { $inc: { reserved: -count, failed: count } }
      )
    ]);

    if (smtpAccountId) {
      await Promise.all([
        EmailQuota.updateOne(
          { targetType: 'smtp_account', targetId: smtpAccountId, period: 'daily', dateKey: todayKey },
          { $inc: { reserved: -count, failed: count } }
        ),
        EmailQuota.updateOne(
          { targetType: 'smtp_account', targetId: smtpAccountId, period: 'monthly', dateKey: monthKey },
          { $inc: { reserved: -count, failed: count } }
        )
      ]);
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to reconcile quota on failure');
  }
}
