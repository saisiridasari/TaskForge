const express = require('express');
const router = express.Router();
const { uploadTaskAttachment, deleteTaskAttachment, uploadAvatar } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { uploadAttachment, uploadAvatar: avatarUpload } = require('../config/cloudinary');

router.use(protect);

router.post('/task/:taskId/attachment', uploadAttachment.single('file'), uploadTaskAttachment);
router.delete('/task/:taskId/attachment/:attachmentId', deleteTaskAttachment);
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);

module.exports = router;
