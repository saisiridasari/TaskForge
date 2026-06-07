const Task = require('../models/Task');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const { logActivity } = require('../config/activityHelper');

// @desc  Upload attachment to task
// @route POST /api/upload/task/:taskId/attachment
const uploadTaskAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const attachment = {
      fileName: req.file.originalname || req.file.filename,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      publicId: req.file.filename,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $push: { attachments: attachment } },
      { new: true }
    ).populate('attachments.uploadedBy', 'name email');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await logActivity({
      userId: req.user._id,
      action: `uploaded file "${attachment.fileName}" to "${task.title}"`,
      actionType: 'attachment_added',
      projectId: task.projectId,
      taskId: task._id,
    });

    res.json({ success: true, attachment, attachments: task.attachments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete attachment from task
// @route DELETE /api/upload/task/:taskId/attachment/:attachmentId
const deleteTaskAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

    // Delete from cloudinary if publicId exists
    if (attachment.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        await cloudinary.uploader.destroy(attachment.publicId, { resource_type: 'raw' });
      } catch (e) {
        try { await cloudinary.uploader.destroy(attachment.publicId); } catch (_) {}
      }
    }

    await Task.findByIdAndUpdate(req.params.taskId, {
      $pull: { attachments: { _id: req.params.attachmentId } },
    });

    await logActivity({
      userId: req.user._id,
      action: `deleted attachment "${attachment.fileName}"`,
      actionType: 'attachment_deleted',
      projectId: task.projectId,
      taskId: task._id,
    });

    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Upload avatar
// @route POST /api/upload/avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const avatarUrl = req.file.path;
    const user = await User.findByIdAndUpdate(
      req.user._id, { avatar: avatarUrl }, { new: true }
    ).select('-password');

    res.json({ success: true, avatar: avatarUrl, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadTaskAttachment, deleteTaskAttachment, uploadAvatar };
