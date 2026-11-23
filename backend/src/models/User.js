import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'user'],
    default: 'user',
    index: true
  },
  // Approval status decided by admin
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
    index: true
  },
  // API Key generated when approved
  apiKey: {
    type: String,
    default: '' // Stored encrypted or direct for user retrieval in portal
  },
  keyPrefix: {
    type: String,
    default: '',
    index: true
  },
  keyHash: {
    type: String,
    default: '',
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
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.keyHash;
  return obj;
};

export const User = mongoose.model('User', UserSchema);
