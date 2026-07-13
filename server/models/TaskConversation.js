// server/models/TaskConversation.js
//
// WHAT THIS IS FOR:
// Per-task, per-user Q&A history for the Phase 3 AI panel. One document per
// (task, user) pair — not a global chat log — so history stays scoped to
// "what has this user asked about this specific task."
//
// `summarizedContext` holds a rolling summary of older messages once the
// raw list grows past a threshold (see taskIntelligenceService.js's
// maybeSummarize) — keeps prompt size bounded as history accumulates,
// instead of resending the entire conversation every time.

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: false }
);

const taskConversationSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    summarizedContext: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One conversation per user per task — lets us upsert-by-find reliably.
taskConversationSchema.index({ taskId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('TaskConversation', taskConversationSchema);