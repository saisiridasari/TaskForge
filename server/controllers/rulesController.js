const Rule = require('../models/Rule');
const Notification = require('../models/Notification');
const Project = require('../models/Project');

const getRules = async (req, res) => {
  try {
    const rules = await Rule.find({ projectId: req.params.projectId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRule = async (req, res) => {
  try {
    const { name, trigger, triggerValue, action, actionValue, projectId } = req.body;
    const rule = await Rule.create({
      name, trigger, triggerValue, action, actionValue,
      projectId: req.params.projectId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRule = async (req, res) => {
  try {
    await Rule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Execute automation rules for a given trigger event
const executeRules = async ({ projectId, trigger, task, io }) => {
  try {
    const rules = await Rule.find({ projectId, trigger, enabled: true });
    if (!rules.length) return;

    const project = await Project.findById(projectId).populate('members.user', '_id email');

    for (const rule of rules) {
      if (rule.action === 'notify_manager') {
        const managers = project.members.filter(m => m.role === 'admin' || m.role === 'manager');
        for (const m of managers) {
          await Notification.create({
            userId: m.user._id,
            message: `Automation: "${rule.name}" triggered — ${task?.title || 'a task'}`,
            type: 'general',
            relatedProject: projectId,
          });
          if (io) io.to(`user:${m.user._id}`).emit('notification:new', {});
        }
      }

      if (rule.action === 'notify_assignees' && task?.assignedTo?.length) {
        for (const userId of task.assignedTo) {
          await Notification.create({
            userId,
            message: `Automation: "${rule.name}" triggered for task "${task.title}"`,
            type: 'general',
            relatedProject: projectId,
          });
          if (io) io.to(`user:${userId}`).emit('notification:new', {});
        }
      }

      if (rule.action === 'notify_all_members') {
        for (const m of project.members) {
          await Notification.create({
            userId: m.user._id,
            message: `Automation: "${rule.name}" triggered in project`,
            type: 'general',
            relatedProject: projectId,
          });
          if (io) io.to(`user:${m.user._id}`).emit('notification:new', {});
        }
      }
    }
  } catch (err) {
    console.error('Rule execution error:', err.message);
  }
};

module.exports = { getRules, createRule, updateRule, deleteRule, executeRules };
