// server/routes/ai.js
//
// Same pattern as your other route files: create a router, apply `protect`
// so every /api/ai/* route requires a logged-in user, map URLs to controller
// functions. This file will grow as Phase 2/3 add real endpoints
// (/projects/generate, /tasks/:id/ask, etc.) — for now it just has /ping.

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

// POST /api/ai/tasks/:id/ask
// First real use of verifyTaskProjectMember (built back in Phase 1) — makes
// sure the requesting user actually has access to the project this task
// belongs to before Gemini gets to see any of its data.
router.post('/tasks/:id/ask', verifyTaskProjectMember, askTask);

// PUT /api/ai/tasks/:id/review
router.put('/tasks/:id/review', verifyTaskProjectMember, markTaskReviewed);

module.exports = router;