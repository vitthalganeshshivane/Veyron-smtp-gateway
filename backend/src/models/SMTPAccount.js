import mongoose from 'mongoose';

const SMTPAccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  providerType: {
    type: String,
    enum: ['hostinger', 'google', 'custom'],
    default: 'custom'
  },
  host: {
    type: String,
    required: true,
    trim: true
  },
  port: {
    type: Number,
    required: true,
    default: 587
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  encryptedPassword: {
    type: String,
    required: true
  },
  securityMode: {
    type: String,
    enum: ['SSL/TLS', 'STARTTLS'],
    default: 'STARTTLS'
  },
  fromEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  fromName: {
    type: String,
    default: 'Veyron Gateway'
  },
  dailyLimit: {
    type: Number,
    default: 500
  },
  monthlyLimit: {
    type: Number,
    default: 15000
  },
  rateLimitPerMinute: {
    type: Number,
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  pauseReason: {
    type: String,
    default: ''
  },
  connectionTimeout: {
    type: Number,
    default: 10000 // ms
  },
  socketTimeout: {
    type: Number,
    default: 15000 // ms
  },
  assignedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  lastVerifiedAt: {
    type: Date
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'failed', 'unverified'],
    default: 'unverified'
  },
  lastVerificationError: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Strictly exclude encryptedPassword in toJSON so it's NEVER sent to client
SMTPAccountSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.encryptedPassword;
  return obj;
};

export const SMTPAccount = mongoose.model('SMTPAccount', SMTPAccountSchema);
