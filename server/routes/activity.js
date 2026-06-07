const express = require('express');
const router = express.Router();
const { getProjectActivity, getTaskActivity, getMyActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/me', getMyActivity);
router.get('/project/:projectId', getProjectActivity);
router.get('/task/:taskId', getTaskActivity);

module.exports = router;
