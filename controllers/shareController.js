const File = require('../models/File');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Course = require('../models/Course');

// @desc    Share file with specific user (student or faculty)
// @route   PUT /api/share/:fileId/specific
const shareWithStudents = async (req, res) => {
  try {
    const { userId, studentIds } = req.body;

    const file = await File.findById(req.params.fileId);
    if (!file || file.isDeleted) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to share this file' });
    }

    // Support both single userId and array of studentIds
    const userIds = userId ? [userId] : studentIds || [];

    if (userIds.length === 0) {
      return res.status(400).json({ message: 'No users specified' });
    }

    // Add to sharedWith without duplicates
    userIds.forEach((id) => {
      if (!file.sharedWith.map(String).includes(String(id))) {
        file.sharedWith.push(id);
      }
    });

    file.shareType = 'specific';
    await file.save();

    // Send notifications
    const notifications = userIds.map((id) => ({
      recipient: id,
      sender: req.user._id,
      type: 'file_shared',
      message: `A file "${file.name}" has been shared with you`,
      resourceId: file._id,
    }));
    await Notification.insertMany(notifications);

    await ActivityLog.create({
      user: req.user._id,
      action: 'share',
      description: `${req.user.name} shared file ${file.name} with specific users`,
      resourceId: file._id,
    });

    res.json({ message: 'File shared successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Share file with entire course
// @route   PUT /api/share/:fileId/course
const shareWithCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const file = await File.findById(req.params.fileId);
    if (!file || file.isDeleted) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to share this file' });
    }

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    file.course = courseId;
    file.shareType = 'course';
    file.sharedWith = [];
    await file.save();

    // Notify all students in the course
    const course = await Course.findById(courseId).populate('students', '_id');
    if (course && course.students.length > 0) {
      const notifications = course.students.map((student) => ({
        recipient: student._id,
        sender: req.user._id,
        type: 'file_shared',
        message: `A file "${file.name}" has been shared with your course`,
        resourceId: file._id,
      }));
      await Notification.insertMany(notifications);
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'share',
      description: `${req.user.name} shared file ${file.name} with a course`,
      resourceId: file._id,
    });

    res.json({ message: 'File shared with course successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark file as private
// @route   PUT /api/share/:fileId/private
const makePrivate = async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file || file.isDeleted) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    file.shareType = 'private';
    file.sharedWith = [];
    file.course = null;
    file.expiryDate = null;
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'share',
      description: `${req.user.name} made file ${file.name} private`,
      resourceId: file._id,
    });

    res.json({ message: 'File marked as private', file });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { shareWithStudents, shareWithCourse, makePrivate };