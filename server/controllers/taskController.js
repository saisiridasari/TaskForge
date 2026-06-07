const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { logActivity } = require('../config/activityHelper');
const { emitToProject } = require('../config/socket');

const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email avatar')
      .sort({ order: 1 });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTasksByBoard = async (req, res) => {
  try {
    const tasks = await Task.find({ boardId: req.params.boardId })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ order: 1 });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, boardId, projectId, priority, assignedTo, dueDate, labels } = req.body;
    const count = await Task.countDocuments({ boardId });
    const task = await Task.create({
      title, description, boardId, projectId,
      priority: priority || 'medium',
      assignedTo: assignedTo || [],
      dueDate, labels: labels || [],
      order: count,
      createdBy: req.user._id,
    });

    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        if (userId.toString() !== req.user._id.toString()) {
          await Notification.create({
            userId, message: `You have been assigned to task "${title}"`,
            type: 'task_assigned', relatedTask: task._id, relatedProject: projectId,
          });
          const io = req.app.get('io');
          emitToProject(io, projectId, 'notification:new', { userId });
        }
      }
    }

    await logActivity({
      userId: req.user._id, action: `created task "${title}"`,
      actionType: 'task_created', projectId, taskId: task._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email avatar');

    const io = req.app.get('io');
    emitToProject(io, projectId, 'task:created', { task: populated, projectId });

    res.status(201).json({ success: true, task: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.body.completed === true && oldTask && !oldTask.completed) {
      for (const user of task.assignedTo) {
        await Notification.create({
          userId: user._id, message: `Task "${task.title}" has been marked as completed`,
          type: 'task_completed', relatedTask: task._id, relatedProject: task.projectId,
        });
      }
      await logActivity({
        userId: req.user._id, action: `completed task "${task.title}"`,
        actionType: 'task_completed', projectId: task.projectId, taskId: task._id,
      });
    } else {
      await logActivity({
        userId: req.user._id, action: `updated task "${task.title}"`,
        actionType: 'task_updated', projectId: task.projectId, taskId: task._id,
      });
    }

    const io = req.app.get('io');
    emitToProject(io, task.projectId.toString(), 'task:updated', { task, projectId: task.projectId });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const moveTask = async (req, res) => {
  try {
    const { boardId, order } = req.body;
    const Board = require('../models/Board');
    const board = await Board.findById(boardId);
    const task = await Task.findByIdAndUpdate(
      req.params.id, { boardId, order }, { new: true }
    ).populate('assignedTo', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await logActivity({
      userId: req.user._id,
      action: `moved task "${task.title}" to "${board ? board.name : 'board'}"`,
      actionType: 'task_moved', projectId: task.projectId, taskId: task._id,
      meta: { boardName: board?.name },
    });

    const io = req.app.get('io');
    emitToProject(io, task.projectId.toString(), 'task:moved', {
      taskId: task._id, boardId, order, projectId: task.projectId,
    });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await logActivity({
      userId: req.user._id, action: `deleted task "${task.title}"`,
      actionType: 'task_deleted', projectId: task.projectId,
    });

    const io = req.app.get('io');
    emitToProject(io, task.projectId.toString(), 'task:deleted', {
      taskId: task._id, boardId: task.boardId, projectId: task.projectId,
    });

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.user._id, text: text.trim() } } },
      { new: true }
    ).populate('comments.user', 'name email avatar').populate('assignedTo', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const newComment = task.comments[task.comments.length - 1];

    await logActivity({
      userId: req.user._id, action: `commented on "${task.title}"`,
      actionType: 'comment_added', projectId: task.projectId, taskId: task._id,
    });

    const io = req.app.get('io');
    emitToProject(io, task.projectId.toString(), 'comment:new', {
      taskId: task._id, comment: newComment, projectId: task.projectId,
    });

    res.json({ success: true, comment: newComment, comments: task.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    ).populate('comments.user', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, comments: task.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const totalProjects = await Project.countDocuments({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    });
    const allTasks = await Task.find({
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    });
    const activeTasks = allTasks.filter(t => !t.completed).length;
    const completedTasks = allTasks.filter(t => t.completed).length;
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const pendingDeadlines = allTasks.filter(
      t => t.dueDate && t.dueDate > now && t.dueDate <= threeDaysLater && !t.completed
    ).length;

    res.json({ success: true, stats: { totalProjects, activeTasks, completedTasks, pendingDeadlines } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTasksByProject, getTasksByBoard, createTask, updateTask,
  moveTask, deleteTask, addComment, deleteComment, getDashboardStats,
};
