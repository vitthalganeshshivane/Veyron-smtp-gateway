import mongoose from 'mongoose';

const EmailLogSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  idempotencyKey: {
    type: String,
    index: true,
    sparse: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  projectName: {
    type: String,
    default: ''
  },
  smtpAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SMTPAccount',
    index: true
  },
  smtpAccountName: {
    type: String,
    default: ''
  },
  sender: {
    name: { type: String, default: '' },
    address: { type: String, required: true }
  },
  recipients: [{
    type: String,
    required: true,
    lowercase: true,
    trim: true
  }],
  cc: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  bcc: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'sent', 'delivered', 'bounced', 'rejected', 'failed'],
    default: 'queued',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  lastError: {
    message: String,
    code: String,
    response: String,
    isPermanent: Boolean,
    timestamp: Date
  },
  smtpResponse: {
    messageId: String,
    response: String,
    accepted: [String],
    rejected: [String]
  },
  messageId: {
    type: String,
    index: true
  },
  hasAttachments: {
    type: Boolean,
    default: false
  },
  attachmentCount: {
    type: Number,
    default: 0
  },
  queuedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processingAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for fast dashboard queries
EmailLogSchema.index({ projectId: 1, createdAt: -1 });
EmailLogSchema.index({ status: 1, createdAt: -1 });
EmailLogSchema.index({ smtpAccountId: 1, createdAt: -1 });

export const EmailLog = mongoose.model('EmailLog', EmailLogSchema);
