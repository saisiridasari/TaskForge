const Activity = require('../models/Activity');

const logActivity = async ({ userId, action, actionType, projectId, taskId, meta = {} }) => {
  try {
    await Activity.create({
      user: userId,
      action,
      actionType,
      project: projectId,
      task: taskId,
      meta,
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

module.exports = { logActivity };
