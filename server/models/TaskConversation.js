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

taskConversationSchema.index({ taskId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('TaskConversation', taskConversationSchema);