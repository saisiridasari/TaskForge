const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/aiRateLimit');
const { verifyTaskProjectMember } = require('../middleware/verifyProjectMember');
const { pingAI, generateProject, askTask, markTaskReviewed } = require('../controllers/aiController');

router.use(protect);
router.use(aiRateLimit);

// POST /api/ai/ping
router.post('/ping', pingAI);

// POST /api/ai/projects/generate
router.post('/projects/generate', generateProject);

router.post('/tasks/:id/ask', verifyTaskProjectMember, askTask);

// PUT /api/ai/tasks/:id/review
router.put('/tasks/:id/review', verifyTaskProjectMember, markTaskReviewed);

module.exports = router;