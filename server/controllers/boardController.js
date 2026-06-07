const Board = require('../models/Board');
const Task = require('../models/Task');
const { logActivity } = require('../config/activityHelper');
const { emitToProject } = require('../config/socket');

const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({ projectId: req.params.projectId }).sort({ order: 1 });
    res.json({ success: true, boards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBoard = async (req, res) => {
  try {
    const { name, projectId, color } = req.body;
    const count = await Board.countDocuments({ projectId });
    const board = await Board.create({ name, projectId, color, order: count });

    await logActivity({
      userId: req.user._id, action: `created board "${name}"`,
      actionType: 'board_created', projectId,
    });

    const io = req.app.get('io');
    emitToProject(io, projectId, 'board:created', { board, projectId });

    res.status(201).json({ success: true, board });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    const io = req.app.get('io');
    emitToProject(io, board.projectId.toString(), 'board:updated', { board, projectId: board.projectId });

    res.json({ success: true, board });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    await Task.deleteMany({ boardId: req.params.id });
    await Board.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    emitToProject(io, board.projectId.toString(), 'board:deleted', {
      boardId: req.params.id, projectId: board.projectId,
    });

    res.json({ success: true, message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBoards, createBoard, updateBoard, deleteBoard };
