import mongoose from 'mongoose';

const IdempotencyRecordSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  jobId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
  },
  response: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL index: Automatically deletes records after 24 hours (86400 seconds)
  }
});

IdempotencyRecordSchema.index({ key: 1, projectId: 1 }, { unique: true });

export const IdempotencyRecord = mongoose.model('IdempotencyRecord', IdempotencyRecordSchema);
