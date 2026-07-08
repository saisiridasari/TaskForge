// server/middleware/verifyProjectMember.js
//
// WHY THIS FILE EXISTS:
// Per the handbook (§17.2), board/task/upload routes currently check
// authentication (`protect`) but NOT project membership — any logged-in
// user who knows an id can read/modify another project's data (IDOR).
// This gets fixed here once, and every AI route (and ideally the existing
// routes too, over time) mounts one of these three middlewares after `protect`.
//
// Three variants because routes carry the project reference differently:
//   - verifyProjectMember        -> route already has projectId (params/body/query)
//   - verifyBoardProjectMember   -> route only has a board id (e.g. PUT /boards/:id)
//   - verifyTaskProjectMember    -> route only has a task id (e.g. PUT /tasks/:id,
//                                    upload routes keyed by :taskId)

const mongoose = require('mongoose');
const Project = require('../models/Project');
const Board = require('../models/Board');
const Task = require('../models/Task');

async function checkMembership(userId, projectId) {
  const project = await Project.findById(projectId).select('owner members');

  if (!project) {
    return { ok: false, status: 404, message: 'Project not found' };
  }

  const uid = userId.toString();
  const isOwner = project.owner.toString() === uid;
  const isMember = project.members.some((m) => m.user.toString() === uid);

  if (!isOwner && !isMember) {
    return { ok: false, status: 403, message: 'Not authorized for this project' };
  }

  return { ok: true, project };
}

// Mount after `protect`, on routes where projectId is directly available.
const verifyProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ message: 'A valid projectId is required' });
    }

    const result = await checkMembership(req.user._id, projectId);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    req.project = result.project; // available to the controller if useful
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error verifying project access' });
  }
};

// Mount after `protect`, on routes keyed by :id where that id is a Board.
const verifyBoardProjectMember = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id).select('projectId');
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const result = await checkMembership(req.user._id, board.projectId);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    req.project = result.project;
    req.board = board;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error verifying project access' });
  }
};

// Mount after `protect`, on routes keyed by a Task id (:id or :taskId).
const verifyTaskProjectMember = async (req, res, next) => {
  try {
    const taskId = req.params.id || req.params.taskId;
    const task = await Task.findById(taskId).select('projectId');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const result = await checkMembership(req.user._id, task.projectId);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    req.project = result.project;
    req.task = task;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error verifying project access' });
  }
};

module.exports = {
  verifyProjectMember,
  verifyBoardProjectMember,
  verifyTaskProjectMember,
};