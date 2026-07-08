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
const { pingAI, generateProject } = require('../controllers/aiController');

router.use(protect);
router.use(aiRateLimit);

// POST /api/ai/ping
router.post('/ping', pingAI);

// POST /api/ai/projects/generate
router.post('/projects/generate', generateProject);

module.exports = router;