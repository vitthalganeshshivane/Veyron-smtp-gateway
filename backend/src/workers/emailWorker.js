import { Worker, UnrecoverableError } from 'bullmq';
import { redisConfig, closeRedisConnection } from '../config/redis.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { EMAIL_QUEUE_NAME } from '../queues/emailQueue.js';
import { EmailLog } from '../models/EmailLog.js';
import { SMTPAccount } from '../models/SMTPAccount.js';
import { SystemLog } from '../models/SystemLog.js';
import { DeliveryEvent } from '../models/DeliveryEvent.js';
import {
  getOrCreateTransporter,
  createDynamicTransporter,
  classifySmtpError,
  invalidateTransporter
} from '../providers/smtpTransportFactory.js';
import { recordQuotaSuccess, recordQuotaFailure } from '../services/quotaService.js';
import { validateSafeUrl } from '../utils/ssrfProtection.js';
import { decrypt } from '../utils/encryption.js';

let worker = null;

/**
 * Worker Job Processor
 */
async function processEmailJob(job) {
  const { jobId, projectId, smtpAccountId, dynamicSmtp, payload, recipientCount } = job.data;
  const attemptsMade = job.attemptsMade;

  logger.info({ jobId, attempt: attemptsMade + 1, projectId, isDynamic: !!dynamicSmtp }, 'Worker picked up email job');

  // Update status to processing
  await EmailLog.findOneAndUpdate(
    { jobId },
    {
      status: 'processing',
      processingAt: new Date(),
      $inc: { attempts: 1 }
    }
  );

  let transporter;
  let providerDisplayName = 'Dynamic SMTP';

  // 1. DYNAMIC ON-THE-FLY SMTP PATH
  if (dynamicSmtp) {
    try {
      const decryptedPass = decrypt(dynamicSmtp.auth.encryptedPass);
      const dynamicConfig = {
        host: dynamicSmtp.host,
        port: dynamicSmtp.port,
        secure: dynamicSmtp.secure,
        securityMode: dynamicSmtp.securityMode,
        auth: {
          user: dynamicSmtp.auth.user,
          pass: decryptedPass
        },
        tls: dynamicSmtp.tls
      };

      transporter = createDynamicTransporter(dynamicConfig);
      providerDisplayName = `${dynamicSmtp.host}:${dynamicSmtp.port}`;
    } catch (decryptErr) {
      const errorMsg = `Failed to decrypt dynamic credentials: ${decryptErr.message}`;
      await handlePermanentFailure(jobId, projectId, null, recipientCount, { message: errorMsg });
      throw new UnrecoverableError(errorMsg);
    }
  } else {
    // 2. PRECONFIGURED DATABASE SMTP ACCOUNT PATH
    const smtpAccount = await SMTPAccount.findById(smtpAccountId);
    if (!smtpAccount) {
      const errorMsg = `Assigned SMTP Account ${smtpAccountId} no longer exists`;
      await handlePermanentFailure(jobId, projectId, smtpAccountId, recipientCount, { message: errorMsg });
      throw new UnrecoverableError(errorMsg);
    }

    if (!smtpAccount.isActive || smtpAccount.isPaused) {
      const errorMsg = `SMTP Account ${smtpAccount.name} is inactive or paused: ${smtpAccount.pauseReason || 'Paused by admin'}`;
      await handlePermanentFailure(jobId, projectId, smtpAccountId, recipientCount, { message: errorMsg });
      throw new UnrecoverableError(errorMsg);
    }

    transporter = getOrCreateTransporter(smtpAccount);
    providerDisplayName = smtpAccount.name;
  }

  // Handle SSRF validation for remote attachments
  if (payload.attachments && payload.attachments.length > 0) {
    for (const att of payload.attachments) {
      if (att.path && (att.path.startsWith('http://') || att.path.startsWith('https://'))) {
        try {
          await validateSafeUrl(att.path);
        } catch (ssrfErr) {
          logger.error({ jobId, url: att.path, error: ssrfErr.message }, 'SSRF check failed for email attachment');
          await handlePermanentFailure(jobId, projectId, smtpAccountId, recipientCount, ssrfErr);
          throw new UnrecoverableError(`Attachment security validation failed: ${ssrfErr.message}`);
        }
      }
    }
  }

  // Construct Nodemailer message (Strict Content Preservation)
  const mailOptions = {};

  if (payload.rawMime) {
    mailOptions.raw = payload.rawMime;
  } else {
    if (payload.from) {
      mailOptions.from = payload.from;
    } else if (dynamicSmtp) {
      mailOptions.from = dynamicSmtp.auth.user;
    }

    mailOptions.to = payload.to;
    if (payload.cc && payload.cc.length > 0) mailOptions.cc = payload.cc;
    if (payload.bcc && payload.bcc.length > 0) mailOptions.bcc = payload.bcc;
    mailOptions.subject = payload.subject;

    if (payload.html) mailOptions.html = payload.html;
    if (payload.text) mailOptions.text = payload.text;
    if (payload.replyTo) mailOptions.replyTo = payload.replyTo;
    if (payload.headers) mailOptions.headers = payload.headers;
    if (payload.attachments && payload.attachments.length > 0) {
      mailOptions.attachments = payload.attachments;
    }
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    const messageId = info.messageId || `msg_${Date.now()}`;
    logger.info({ jobId, messageId, provider: providerDisplayName }, 'Email successfully accepted by SMTP server');

    // Update EmailLog to 'sent'
    await EmailLog.findOneAndUpdate(
      { jobId },
      {
        status: 'sent',
        messageId,
        sentAt: new Date(),
        smtpResponse: {
          messageId,
          response: info.response || '250 OK',
          accepted: info.accepted || [],
          rejected: info.rejected || []
        }
      }
    );

    // Record DeliveryEvent
    await DeliveryEvent.create({
      emailLogId: (await EmailLog.findOne({ jobId }))?._id,
      jobId,
      eventType: 'sent',
      providerResponse: info.response || 'Message queued for delivery by upstream MTA',
      rawPayload: { accepted: info.accepted, rejected: info.rejected }
    });

    // Reconcile Quota
    await recordQuotaSuccess(projectId, smtpAccountId, recipientCount);

    return {
      success: true,
      messageId,
      response: info.response
    };
  } catch (error) {
    const classification = classifySmtpError(error);
    logger.warn({ jobId, error: error.message, classification, provider: providerDisplayName }, 'SMTP send error occurred');

    // If pre-configured account experienced auth failure, pause it
    if (classification.isAuthFailure && smtpAccountId) {
      logger.fatal({ accountId: smtpAccountId }, 'SMTP Authentication Failure! Pausing account.');
      await SMTPAccount.findByIdAndUpdate(smtpAccountId, {
        isPaused: true,
        pauseReason: `Authentication failed at ${new Date().toISOString()}: ${error.message}`,
        verificationStatus: 'failed',
        lastVerificationError: error.message
      });

      invalidateTransporter(smtpAccountId);

      await SystemLog.create({
        level: 'fatal',
        event: 'smtp_auth_failed',
        message: `SMTP Account was automatically paused due to authentication failure.`,
        smtpAccountId,
        details: { error: error.message, response: error.response }
      });
    }

    // Permanent 5xx or non-retryable failure
    if (classification.isPermanent) {
      await handlePermanentFailure(jobId, projectId, smtpAccountId, recipientCount, error);
      throw new UnrecoverableError(`Permanent delivery failure: ${classification.reason}`);
    }

    // Transient failure: check if max retries reached
    const maxRetries = env.JOB_MAX_RETRIES;
    if (attemptsMade + 1 >= maxRetries) {
      await handlePermanentFailure(jobId, projectId, smtpAccountId, recipientCount, error);
      throw error;
    }

    // Update EmailLog with transient error diagnostic
    await EmailLog.findOneAndUpdate(
      { jobId },
      {
        lastError: {
          message: error.message,
          code: error.code || '',
          response: error.response || '',
          isPermanent: false,
          timestamp: new Date()
        }
      }
    );

    throw error;
  }
}

async function handlePermanentFailure(jobId, projectId, smtpAccountId, recipientCount, error) {
  await EmailLog.findOneAndUpdate(
    { jobId },
    {
      status: 'failed',
      failedAt: new Date(),
      lastError: {
        message: error.message,
        code: error.code || '',
        response: error.response || '',
        isPermanent: true,
        timestamp: new Date()
      }
    }
  );

  await recordQuotaFailure(projectId, smtpAccountId, recipientCount);
}

/**
 * Start the BullMQ Worker process
 */
export async function startWorker() {
  await connectDatabase();

  worker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: redisConfig,
    concurrency: env.WORKER_CONCURRENCY,
    lockDuration: env.JOB_TIMEOUT_MS + 10000,
    autorun: true
  });

  worker.on('ready', () => {
    logger.info({ concurrency: env.WORKER_CONCURRENCY }, 'Veyron SMTP BullMQ Worker started and ready');
  });

  worker.on('failed', (job, err) => {
    logger.warn({ jobId: job?.id, error: err.message }, 'Job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err: err.message }, 'Worker process error');
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down BullMQ worker gracefully...');
    if (worker) {
      await worker.close();
    }
    await closeRedisConnection();
    await disconnectDatabase();
    logger.info('Worker shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return worker;
}

if (process.argv[1] && process.argv[1].endsWith('emailWorker.js')) {
  startWorker().catch((err) => {
    logger.fatal({ err }, 'Failed to start BullMQ email worker');
    process.exit(1);
  });
}
