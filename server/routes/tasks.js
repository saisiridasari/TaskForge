const express = require('express');
const router = express.Router();
const {
  getTasksByProject, getTasksByBoard, createTask, updateTask,
  moveTask, deleteTask, addComment, deleteComment, getDashboardStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/project/:projectId', getTasksByProject);
router.get('/board/:boardId', getTasksByBoard);
router.post('/', createTask);
router.put('/:id', updateTask);
router.put('/:id/move', moveTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
