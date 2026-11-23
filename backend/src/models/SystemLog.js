import mongoose from 'mongoose';

const SystemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'fatal'],
    default: 'info',
    index: true
  },
  event: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  smtpAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SMTPAccount'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Automatically expire after 30 days (TTL index)
  }
});

export const SystemLog = mongoose.model('SystemLog', SystemLogSchema);
