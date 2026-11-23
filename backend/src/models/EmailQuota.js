import mongoose from 'mongoose';

const EmailQuotaSchema = new mongoose.Schema({
  // Either projectId or smtpAccountId (or both)
  targetType: {
    type: String,
    enum: ['project', 'smtp_account'],
    required: true,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['daily', 'monthly'],
    required: true
  },
  dateKey: {
    type: String,
    required: true // e.g. '2026-11-16' for daily, '2026-11' for monthly
  },
  reserved: {
    type: Number,
    default: 0
  },
  sent: {
    type: Number,
    default: 0
  },
  failed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

EmailQuotaSchema.index({ targetType: 1, targetId: 1, period: 1, dateKey: 1 }, { unique: true });

export const EmailQuota = mongoose.model('EmailQuota', EmailQuotaSchema);
