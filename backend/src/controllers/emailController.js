import crypto from 'crypto';
import { EmailLog } from '../models/EmailLog.js';
import { Project } from '../models/Project.js';
import { SMTPAccount } from '../models/SMTPAccount.js';
import { IdempotencyRecord } from '../models/IdempotencyRecord.js';
import { DeliveryEvent } from '../models/DeliveryEvent.js';
import { enqueueEmail } from '../queues/emailQueue.js';
import { selectSmtpAccount, isSenderAllowed } from '../services/accountSelector.js';
import { reserveQuota } from '../services/quotaService.js';
import { encrypt } from '../utils/encryption.js';
import { verifyDynamicSmtp } from '../providers/smtpTransportFactory.js';
import { logger } from '../utils/logger.js';

/**
 * Helper to extract dynamic SMTP credentials from Body or X-SMTP-* Headers
 */
function extractDynamicSmtp(req) {
  // 1. From request body
  if (req.body.smtp && req.body.smtp.host && req.body.smtp.auth?.user && req.body.smtp.auth?.pass) {
    return {
      host: req.body.smtp.host,
      port: parseInt(req.body.smtp.port || 587, 10),
      secure: req.body.smtp.secure,
      securityMode: req.body.smtp.securityMode,
      auth: {
        user: req.body.smtp.auth.user,
        pass: req.body.smtp.auth.pass
      },
      tls: req.body.smtp.tls
    };
  }

  // 2. From X-SMTP-* Headers
  const host = req.headers['x-smtp-host'];
  const user = req.headers['x-smtp-user'];
  const pass = req.headers['x-smtp-pass'];

  if (host && user && pass) {
    const port = parseInt(req.headers['x-smtp-port'] || 587, 10);
    const secure = req.headers['x-smtp-secure'] === 'true' || port === 465;
    return {
      host,
      port,
      secure,
      auth: { user, pass }
    };
  }

  return null;
}

/**
 * Handle Single Email Send Request
 * Supports Dynamic On-The-Fly SMTP Credentials in Body or Headers
 * POST /api/v1/emails/send
 */
export async function sendEmail(req, res) {
  try {
    const project = req.project;
    const idempotencyKey = req.headers['idempotency-key'];

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await IdempotencyRecord.findOne({
        key: idempotencyKey,
        projectId: project._id
      });

      if (existing) {
        logger.info({ key: idempotencyKey, jobId: existing.jobId }, 'Returning cached idempotency response');
        return res.status(202).json(existing.response);
      }
    }

    const payload = req.body;

    // 2. Sender Authorization Check
    let senderAddress = '';
    if (typeof payload.from === 'string') {
      senderAddress = payload.from;
    } else if (payload.from && payload.from.address) {
      senderAddress = payload.from.address;
    }

    if (senderAddress && !isSenderAllowed(senderAddress, project.allowedSenders)) {
      return res.status(403).json({
        success: false,
        error: `Sender address "${senderAddress}" is not in the project's allowed senders list`
      });
    }

    // 3. Normalize Recipients
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const cc = Array.isArray(payload.cc) ? payload.cc : (payload.cc ? [payload.cc] : []);
    const bcc = Array.isArray(payload.bcc) ? payload.bcc : (payload.bcc ? [payload.bcc] : []);
    const totalRecipients = recipients.length + cc.length + bcc.length;

    // 4. Check for Dynamic SMTP credentials in Body or Headers
    const dynamicSmtp = extractDynamicSmtp(req);
    let smtpAccountId = null;
    let smtpAccountName = '';

    if (dynamicSmtp) {
      smtpAccountName = `Dynamic (${dynamicSmtp.host}:${dynamicSmtp.port})`;
      if (!senderAddress) {
        senderAddress = dynamicSmtp.auth.user;
      }
    } else {
      // Fallback: Select pre-configured SMTP account from Database
      try {
        const smtpAccount = await selectSmtpAccount(project, payload.smtpAccountId);
        smtpAccountId = smtpAccount._id;
        smtpAccountName = smtpAccount.name;
        if (!senderAddress) {
          senderAddress = smtpAccount.fromEmail;
        }
      } catch (err) {
        return res.status(503).json({
          success: false,
          error: `No SMTP provider specified and no default available: ${err.message}. Provide dynamic SMTP credentials via 'smtp' object in body or X-SMTP-* headers.`
        });
      }
    }

    // 5. Check and Reserve Quota
    const quotaResult = await reserveQuota(project._id, smtpAccountId, totalRecipients);
    if (!quotaResult.allowed) {
      return res.status(429).json({
        success: false,
        error: quotaResult.reason || 'Sending quota exceeded'
      });
    }

    // 6. Generate unique Job ID
    const jobId = `vms_${crypto.randomBytes(6).toString('hex')}`;

    // 7. Create EmailLog in MongoDB Atlas
    await EmailLog.create({
      jobId,
      idempotencyKey,
      projectId: project._id,
      projectName: project.name,
      smtpAccountId: smtpAccountId,
      smtpAccountName,
      sender: typeof payload.from === 'object' ? payload.from : { address: senderAddress },
      recipients,
      cc,
      bcc,
      subject: payload.subject,
      status: 'queued',
      hasAttachments: (payload.attachments && payload.attachments.length > 0) || false,
      attachmentCount: payload.attachments?.length || 0,
      metadata: payload.metadata || {}
    });

    // 8. Enqueue Job to BullMQ
    // If dynamic SMTP is provided, encrypt password so plaintext is NEVER stored in Redis!
    let queuedDynamicSmtp = null;
    if (dynamicSmtp) {
      queuedDynamicSmtp = {
        host: dynamicSmtp.host,
        port: dynamicSmtp.port,
        secure: dynamicSmtp.secure,
        securityMode: dynamicSmtp.securityMode,
        auth: {
          user: dynamicSmtp.auth.user,
          encryptedPass: encrypt(dynamicSmtp.auth.pass)
        },
        tls: dynamicSmtp.tls
      };
    }

    await enqueueEmail({
      jobId,
      projectId: project._id.toString(),
      smtpAccountId: smtpAccountId ? smtpAccountId.toString() : null,
      dynamicSmtp: queuedDynamicSmtp,
      recipientCount: totalRecipients,
      payload: {
        from: payload.from,
        to: recipients,
        cc,
        bcc,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        rawMime: payload.rawMime,
        attachments: payload.attachments,
        replyTo: payload.replyTo,
        headers: payload.headers
      }
    }, jobId);

    const responseBody = {
      success: true,
      jobId,
      status: 'queued',
      deliveryMode: dynamicSmtp ? 'dynamic-smtp' : 'account-relay',
      smtpHost: dynamicSmtp ? dynamicSmtp.host : smtpAccountName,
      message: 'Email accepted for processing'
    };

    // 9. Save Idempotency Record if key provided
    if (idempotencyKey) {
      await IdempotencyRecord.create({
        key: idempotencyKey,
        projectId: project._id,
        jobId,
        status: 'completed',
        response: responseBody
      }).catch(err => logger.warn({ err: err.message }, 'Failed to persist idempotency record'));
    }

    return res.status(202).json(responseBody);
  } catch (err) {
    logger.error({ err: err.message }, 'Error in sendEmail controller');
    res.status(500).json({ success: false, error: 'Internal gateway error during email queueing' });
  }
}

/**
 * Handle Bulk Email Send Request
 * POST /api/v1/emails/bulk
 */
export async function sendBulk(req, res) {
  try {
    const project = req.project;
    const { emails, smtp: batchDynamicSmtp } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of emails is required' });
    }

    const results = [];
    let queuedCount = 0;
    let failedCount = 0;

    for (const emailData of emails) {
      try {
        const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
        const cc = Array.isArray(emailData.cc) ? emailData.cc : [];
        const bcc = Array.isArray(emailData.bcc) ? emailData.bcc : [];
        const totalRecipients = recipients.length + cc.length + bcc.length;

        const dynamicSmtp = emailData.smtp || batchDynamicSmtp || extractDynamicSmtp(req);
        let smtpAccountId = null;
        let smtpAccountName = '';

        if (dynamicSmtp) {
          smtpAccountName = `Dynamic (${dynamicSmtp.host}:${dynamicSmtp.port})`;
        } else {
          const smtpAccount = await selectSmtpAccount(project, emailData.smtpAccountId);
          smtpAccountId = smtpAccount._id;
          smtpAccountName = smtpAccount.name;
        }

        const quotaResult = await reserveQuota(project._id, smtpAccountId, totalRecipients);
        if (!quotaResult.allowed) {
          results.push({
            success: false,
            subject: emailData.subject,
            error: quotaResult.reason
          });
          failedCount++;
          continue;
        }

        const jobId = `vms_${crypto.randomBytes(6).toString('hex')}`;

        await EmailLog.create({
          jobId,
          projectId: project._id,
          projectName: project.name,
          smtpAccountId,
          smtpAccountName,
          sender: typeof emailData.from === 'object' ? emailData.from : { address: dynamicSmtp ? dynamicSmtp.auth.user : 'relay' },
          recipients,
          cc,
          bcc,
          subject: emailData.subject,
          status: 'queued',
          hasAttachments: !!emailData.attachments?.length,
          attachmentCount: emailData.attachments?.length || 0,
          metadata: emailData.metadata || {}
        });

        let queuedDynamicSmtp = null;
        if (dynamicSmtp) {
          queuedDynamicSmtp = {
            host: dynamicSmtp.host,
            port: dynamicSmtp.port,
            secure: dynamicSmtp.secure,
            securityMode: dynamicSmtp.securityMode,
            auth: {
              user: dynamicSmtp.auth.user,
              encryptedPass: encrypt(dynamicSmtp.auth.pass)
            },
            tls: dynamicSmtp.tls
          };
        }

        await enqueueEmail({
          jobId,
          projectId: project._id.toString(),
          smtpAccountId: smtpAccountId ? smtpAccountId.toString() : null,
          dynamicSmtp: queuedDynamicSmtp,
          recipientCount: totalRecipients,
          payload: emailData
        }, jobId);

        results.push({
          success: true,
          jobId,
          status: 'queued'
        });
        queuedCount++;
      } catch (subErr) {
        results.push({
          success: false,
          subject: emailData.subject,
          error: subErr.message
        });
        failedCount++;
      }
    }

    res.status(202).json({
      success: true,
      summary: {
        total: emails.length,
        queued: queuedCount,
        failed: failedCount
      },
      results
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error in sendBulk controller');
    res.status(500).json({ success: false, error: 'Bulk dispatch error' });
  }
}

/**
 * Verify On-The-Fly Dynamic SMTP Credentials Without Saving to Database
 * POST /api/v1/emails/verify-smtp
 */
export async function testDynamicSmtp(req, res) {
  try {
    const dynamicSmtp = extractDynamicSmtp(req);
    if (!dynamicSmtp) {
      return res.status(400).json({
        success: false,
        error: 'Provide SMTP details in request body { smtp: { host, port, auth: { user, pass } } } or headers X-SMTP-*'
      });
    }

    const result = await verifyDynamicSmtp(dynamicSmtp);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Paginated Email History
 * GET /api/v1/emails
 */
export async function getEmailLogs(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const query = {};

    if (req.project) {
      query.projectId = req.project._id;
    } else if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.smtpAccountId) {
      query.smtpAccountId = req.query.smtpAccountId;
    }

    if (req.query.search) {
      const s = req.query.search.trim();
      query.$or = [
        { subject: { $regex: s, $options: 'i' } },
        { recipients: { $regex: s, $options: 'i' } },
        { jobId: { $regex: s, $options: 'i' } }
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
    }

    const [logs, total] = await Promise.all([
      EmailLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmailLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      logs
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error in getEmailLogs controller');
    res.status(500).json({ success: false, error: 'Failed to retrieve email logs' });
  }
}

/**
 * Get Specific Email Log by Job ID
 * GET /api/v1/emails/:jobId
 */
export async function getEmailLogById(req, res) {
  try {
    const { jobId } = req.params;
    const query = { jobId };

    if (req.project) {
      query.projectId = req.project._id;
    }

    const log = await EmailLog.findOne(query).lean();
    if (!log) {
      return res.status(404).json({ success: false, error: 'Email log not found' });
    }

    const deliveryEvents = await DeliveryEvent.find({ jobId }).sort({ createdAt: 1 }).lean();

    res.json({
      success: true,
      log: {
        ...log,
        deliveryEvents
      }
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error in getEmailLogById');
    res.status(500).json({ success: false, error: 'Failed to fetch email details' });
  }
}

/**
 * Manually Retry a Failed Email
 * POST /api/v1/emails/:jobId/retry
 */
export async function retryEmail(req, res) {
  try {
    const { jobId } = req.params;
    const query = { jobId };

    if (req.project) {
      query.projectId = req.project._id;
    }

    const log = await EmailLog.findOne(query);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Email record not found' });
    }

    if (log.status !== 'failed') {
      return res.status(400).json({
        success: false,
        error: `Cannot retry email in "${log.status}" status. Only "failed" emails can be retried.`
      });
    }

    log.status = 'queued';
    log.attempts = 0;
    log.lastError = undefined;
    await log.save();

    await enqueueEmail({
      jobId: log.jobId,
      projectId: log.projectId.toString(),
      smtpAccountId: log.smtpAccountId ? log.smtpAccountId.toString() : null,
      recipientCount: log.recipients.length + (log.cc?.length || 0) + (log.bcc?.length || 0),
      payload: {
        from: log.sender,
        to: log.recipients,
        cc: log.cc,
        bcc: log.bcc,
        subject: log.subject,
        metadata: log.metadata
      }
    }, log.jobId);

    res.json({
      success: true,
      message: `Email ${jobId} successfully re-queued for delivery`
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error in retryEmail');
    res.status(500).json({ success: false, error: 'Failed to retry email' });
  }
}
