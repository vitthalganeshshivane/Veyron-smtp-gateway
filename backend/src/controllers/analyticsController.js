import { EmailLog } from '../models/EmailLog.js';
import { Project } from '../models/Project.js';
import { SMTPAccount } from '../models/SMTPAccount.js';
import { logger } from '../utils/logger.js';

/**
 * Get Overall Analytics
 * GET /api/v1/analytics/overview
 */
export async function getOverview(req, res) {
  try {
    const [
      totalEmails,
      sentEmails,
      queuedEmails,
      processingEmails,
      failedEmails,
      deliveredEmails,
      totalProjects,
      activeProjects,
      totalSmtp,
      activeSmtp
    ] = await Promise.all([
      EmailLog.countDocuments(),
      EmailLog.countDocuments({ status: 'sent' }),
      EmailLog.countDocuments({ status: 'queued' }),
      EmailLog.countDocuments({ status: 'processing' }),
      EmailLog.countDocuments({ status: 'failed' }),
      EmailLog.countDocuments({ status: 'delivered' }),
      Project.countDocuments(),
      Project.countDocuments({ isActive: true }),
      SMTPAccount.countDocuments(),
      SMTPAccount.countDocuments({ isActive: true, isPaused: false })
    ]);

    const completed = sentEmails + failedEmails;
    const successRate = completed > 0 ? ((sentEmails / completed) * 100).toFixed(1) : 100;

    res.json({
      success: true,
      stats: {
        totalEmails,
        sentEmails,
        queuedEmails,
        processingEmails,
        failedEmails,
        deliveredEmails,
        successRate: parseFloat(successRate),
        projects: {
          total: totalProjects,
          active: activeProjects
        },
        smtpAccounts: {
          total: totalSmtp,
          active: activeSmtp
        }
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error in getOverview analytics');
    res.status(500).json({ success: false, error: 'Failed to fetch analytics overview' });
  }
}

/**
 * Get Daily Time Series for charts
 * GET /api/v1/analytics/daily?days=14
 */
export async function getDaily(req, res) {
  try {
    const days = parseInt(req.query.days || '14', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const matchStage = {
      $match: {
        createdAt: { $gte: startDate }
      }
    };

    const groupStage = {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    };

    const aggregated = await EmailLog.aggregate([matchStage, groupStage]);

    // Format into daily records
    const dailyMap = new Map();
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      dailyMap.set(dateStr, { date: dateStr, sent: 0, failed: 0, queued: 0, processing: 0 });
    }

    aggregated.forEach(item => {
      const dateStr = item._id.date;
      const status = item._id.status;
      if (dailyMap.has(dateStr)) {
        const row = dailyMap.get(dateStr);
        if (status === 'sent' || status === 'delivered') row.sent += item.count;
        else if (status === 'failed') row.failed += item.count;
        else if (status === 'queued') row.queued += item.count;
        else if (status === 'processing') row.processing += item.count;
      }
    });

    res.json({
      success: true,
      data: Array.from(dailyMap.values())
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error in getDaily analytics');
    res.status(500).json({ success: false, error: 'Failed to fetch daily analytics' });
  }
}

/**
 * Get Project Breakdown
 * GET /api/v1/analytics/projects
 */
export async function getProjectStats(req, res) {
  try {
    const aggregated = await EmailLog.aggregate([
      {
        $group: {
          _id: '$projectId',
          projectName: { $first: '$projectName' },
          total: { $sum: 1 },
          sent: {
            $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered']] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, data: aggregated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch project stats' });
  }
}
