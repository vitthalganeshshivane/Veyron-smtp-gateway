import { SMTPAccount } from '../models/SMTPAccount.js';
import { EmailQuota } from '../models/EmailQuota.js';
import { logger } from '../utils/logger.js';

/**
 * Validates whether a sender email matches the allowedSenders pattern
 * Patterns can be exact "support@example.com" or wildcard "*@example.com"
 * If allowedSenders is empty, all senders are permitted.
 */
export function isSenderAllowed(senderAddress, allowedSenders = []) {
  if (!allowedSenders || allowedSenders.length === 0) return true;

  const sender = senderAddress.toLowerCase().trim();
  const domain = sender.split('@')[1];

  return allowedSenders.some(allowed => {
    const pattern = allowed.toLowerCase().trim();
    if (pattern === sender) return true;
    if (pattern.startsWith('*@') && domain && pattern.slice(2) === domain) return true;
    return false;
  });
}

/**
 * Select the best active SMTP account for a project and recipient count
 * @param {Object} project - Project Mongoose document
 * @param {string} [preferredAccountId] - Optional specific account ID requested
 * @returns {Promise<Object>} Selected SMTPAccount document
 */
export async function selectSmtpAccount(project, preferredAccountId = null) {
  const query = {
    isActive: true,
    isPaused: false
  };

  if (preferredAccountId) {
    query._id = preferredAccountId;
  } else if (project.allowedSmtpAccounts && project.allowedSmtpAccounts.length > 0) {
    query._id = { $in: project.allowedSmtpAccounts };
  } else {
    // If project has no explicit restrictions, match accounts assigned to this project or unassigned
    query.$or = [
      { assignedProjects: project._id },
      { assignedProjects: { $size: 0 } }
    ];
  }

  const candidates = await SMTPAccount.find(query);

  if (!candidates || candidates.length === 0) {
    throw new Error('No active or eligible SMTP accounts available for this project');
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  // If multiple candidates, pick the one with lowest daily usage (least loaded)
  const todayKey = new Date().toISOString().slice(0, 10);
  const accountIds = candidates.map(c => c._id);

  const quotas = await EmailQuota.find({
    targetType: 'smtp_account',
    targetId: { $in: accountIds },
    period: 'daily',
    dateKey: todayKey
  });

  const usageMap = new Map();
  quotas.forEach(q => {
    usageMap.set(q.targetId.toString(), (q.sent || 0) + (q.reserved || 0));
  });

  // Sort candidates by remaining capacity descending
  candidates.sort((a, b) => {
    const usageA = usageMap.get(a._id.toString()) || 0;
    const usageB = usageMap.get(b._id.toString()) || 0;
    const remainingA = (a.dailyLimit || 500) - usageA;
    const remainingB = (b.dailyLimit || 500) - usageB;
    return remainingB - remainingA;
  });

  return candidates[0];
}
