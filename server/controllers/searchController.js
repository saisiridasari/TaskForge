const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Board = require('../models/Board');

// @desc  Global search
// @route GET /api/search?q=&type=&priority=&assignedTo=&projectId=
const globalSearch = async (req, res) => {
  try {
    const { q = '', type, priority, assignedTo, projectId, status } = req.query;
    if (!q.trim() && !priority && !assignedTo && !projectId) {
      return res.json({ success: true, results: { tasks: [], projects: [], users: [], boards: [] } });
    }

    const regex = q.trim() ? new RegExp(q.trim(), 'i') : null;

    // Get user's accessible projects
    const myProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    const accessibleProjectIds = myProjects.map(p => p._id);

    const results = {};

    // Search Tasks
    if (!type || type === 'tasks') {
      const taskQuery = { projectId: { $in: accessibleProjectIds } };
      if (regex) taskQuery.$or = [{ title: regex }, { description: regex }];
      if (priority) taskQuery.priority = priority;
      if (assignedTo) taskQuery.assignedTo = assignedTo;
      if (projectId) taskQuery.projectId = projectId;
      if (status === 'completed') taskQuery.completed = true;
      if (status === 'active') taskQuery.completed = false;

      results.tasks = await Task.find(taskQuery)
        .populate('assignedTo', 'name email avatar')
        .populate('projectId', 'title color')
        .populate('boardId', 'name')
        .limit(20)
        .sort({ createdAt: -1 });
    }

    // Search Projects
    if (!type || type === 'projects') {
      const projectQuery = { _id: { $in: accessibleProjectIds } };
      if (regex) projectQuery.$or = [{ title: regex }, { description: regex }];
      if (status) projectQuery.status = status;

      results.projects = await Project.find(projectQuery)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar')
        .limit(10);
    }

    // Search Users (accessible in same projects)
    if (!type || type === 'users') {
      if (regex) {
        results.users = await User.find({
          $or: [{ name: regex }, { email: regex }],
        }).select('name email avatar role').limit(10);
      } else {
        results.users = [];
      }
    }

    // Search Boards
    if (!type || type === 'boards') {
      const boardQuery = { projectId: { $in: accessibleProjectIds } };
      if (regex) boardQuery.name = regex;

      results.boards = await Board.find(boardQuery)
        .populate('projectId', 'title color')
        .limit(10);
    }

    res.json({ success: true, results, query: q });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { globalSearch };
