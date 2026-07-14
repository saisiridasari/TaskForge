const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  trigger: {
    type: String,
    required: true,
    enum: [
      'task_moved_to_board',
      'task_due_soon',
      'task_assigned',
      'project_deadline_changed',
      'task_completed',
      'task_created',
    ],
  },
  triggerValue: {
    
    type: String,
    default: '',
  },
  action: {
    type: String,
    required: true,
    enum: [
      'notify_manager',
      'notify_assignees',
      'notify_all_members',
      'create_reminder',
      'mark_task_complete',
      'assign_to_user',
    ],
  },
  actionValue: {
    type: String,
    default: '',
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Rule', ruleSchema);
