import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  keyPrefix: {
    type: String,
    required: true,
    index: true
  },
  keyHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  dailyLimit: {
    type: Number,
    default: 1000
  },
  monthlyLimit: {
    type: Number,
    default: 30000
  },
  rateLimitPerMinute: {
    type: Number,
    default: 60
  },
  allowedSmtpAccounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SMTPAccount'
  }],
  allowedSenders: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  lastUsedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Hide keyHash when serialized to JSON for dashboard
ProjectSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.keyHash;
  return obj;
};

export const Project = mongoose.model('Project', ProjectSchema);
