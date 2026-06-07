const express = require('express');
const router = express.Router();
const { getUsers, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getUsers);
router.get('/search', searchUsers);

module.exports = router;
