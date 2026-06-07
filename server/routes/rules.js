const express = require('express');
const router = express.Router();
const { getRules, createRule, updateRule, deleteRule } = require('../controllers/rulesController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/project/:projectId', getRules);
router.post('/project/:projectId', createRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

module.exports = router;
