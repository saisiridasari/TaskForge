const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  
    period: {
      type: String,
      required: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

aiUsageSchema.index({ user: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('AIUsage', aiUsageSchema);