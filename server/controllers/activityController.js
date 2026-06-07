const Activity = require('../models/Activity');

// @desc  Get activity for a project
// @route GET /api/activity/project/:projectId
const getProjectActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ project: req.params.projectId })
      .populate('user', 'name email avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments({ project: req.params.projectId });

    res.json({ success: true, activities, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get activity for a task
// @route GET /api/activity/task/:taskId
const getTaskActivity = async (req, res) => {
  try {
    const activities = await Activity.find({ task: req.params.taskId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get global activity for current user's projects
// @route GET /api/activity/me
const getMyActivity = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const myProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    const projectIds = myProjects.map(p => p._id);

    const activities = await Activity.find({ project: { $in: projectIds } })
      .populate('user', 'name email avatar')
      .populate('task', 'title')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProjectActivity, getTaskActivity, getMyActivity };
