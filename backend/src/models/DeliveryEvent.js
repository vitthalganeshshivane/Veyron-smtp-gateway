import mongoose from 'mongoose';

const DeliveryEventSchema = new mongoose.Schema({
  emailLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog',
    required: true,
    index: true
  },
  jobId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: ['sent', 'delivered', 'bounced', 'complaint', 'rejected'],
    required: true,
    index: true
  },
  recipient: {
    type: String
  },
  providerResponse: {
    type: String
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const DeliveryEvent = mongoose.model('DeliveryEvent', DeliveryEventSchema);
