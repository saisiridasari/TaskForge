// server/models/AIUsage.js
//
// WHAT THIS IS FOR:
// Tracks how many Gemini tokens each user has used, bucketed by month.
// This is what the rate-limit middleware (next file) checks before
// allowing a new AI request — without this, there's no way to stop one
// user's usage from running up your Gemini bill.
//
// One document per user per calendar month, e.g. { user, period: "2026-07" }.
// Updated via $inc after every Gemini call that returns usage metadata.

const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // "YYYY-MM", e.g. "2026-07" — keeps usage resettable per billing period
    // without needing a cron job to zero anything out.
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

// One usage document per user per month — this is the constraint the
// rate-limit middleware relies on when it does findOneAndUpdate(..., { upsert: true }).
aiUsageSchema.index({ user: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('AIUsage', aiUsageSchema);