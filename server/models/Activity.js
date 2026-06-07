const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  actionType: {
    type: String,
    enum: [
      'task_created', 'task_updated', 'task_deleted', 'task_moved',
      'task_completed', 'deadline_changed', 'user_assigned', 'user_removed',
      'board_created', 'board_deleted', 'project_updated', 'project_created',
      'comment_added', 'attachment_added', 'attachment_deleted',
    ],
    default: 'task_updated',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
