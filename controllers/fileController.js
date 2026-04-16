const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const path = require('path');
const fs = require('fs');

// @desc    Upload a file
// @route   POST /api/files/upload
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { name, course, department, folder, expiryDate } = req.body;

    const file = await File.create({
      name: name || req.file.originalname,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user._id,
      course: course || null,
      department: department || null,
      shareType: 'private',
      folder: folder || 'general',
      expiryDate: expiryDate || null,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'upload',
      description: `${req.user.name} uploaded file ${file.name}`,
      resourceId: file._id,
    });

    res.status(201).json({ message: 'File uploaded successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all files (role based)
// @route   GET /api/files
const getAllFiles = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      // Admin sees everything including soft deleted
      query = {};
    } else if (req.user.role === 'faculty') {
      // Faculty only sees their own non-deleted files
      query = { isDeleted: false, uploadedBy: req.user._id };
    } else if (req.user.role === 'student') {
      // Fetch courses the student is enrolled in
      const enrolledCourses = await Course.find({
        students: req.user._id,
      }).select('_id');

      const courseIds = enrolledCourses.map((c) => c._id);

      // Student only sees non-deleted files shared with them
      query = {
        isDeleted: false,
        $or: [
          { sharedWith: req.user._id },
          { course: { $in: courseIds }, shareType: 'course' },
        ],
      };
    }

    const files = await File.find(query)
      .populate('uploadedBy', 'name email')
      .populate('course', 'name code')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single file
// @route   GET /api/files/:id
const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('course', 'name code')
      .populate('department', 'name');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download a file
// @route   GET /api/files/:id/download
const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.expiryDate && new Date() > file.expiryDate) {
      return res.status(403).json({ message: 'File access has expired' });
    }

    file.downloadCount += 1;
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'download',
      description: `${req.user.name} downloaded file ${file.name}`,
      resourceId: file._id,
    });

    if (file.path.startsWith('http')) {
      res.redirect(file.path);
    } else {
      res.download(path.resolve(file.path), file.originalName);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Admin = permanent delete
    if (req.user.role === 'admin') {
      // Try to delete physical file if it exists
      try {
        const filePath = path.resolve(file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsErr) {
        // Physical file missing is fine, still delete DB record
      }

      await File.findByIdAndDelete(req.params.id);

      await ActivityLog.create({
        user: req.user._id,
        action: 'delete',
        description: `${req.user.name} permanently deleted file ${file.name}`,
        resourceId: file._id,
      });

      return res.json({ message: 'File permanently deleted' });
    }

    // Faculty or Student = soft delete
    file.isDeleted = true;
    file.deletedBy = req.user._id;
    file.deletedByRole = req.user.role;
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      description: `${req.user.name} deleted file ${file.name}`,
      resourceId: file._id,
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Restore soft deleted file
// @route   PUT /api/files/:id/restore
const restoreFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.isDeleted = false;
    file.deletedBy = null;
    file.deletedByRole = null;
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'restore',
      description: `${req.user.name} restored file ${file.name}`,
      resourceId: file._id,
    });

    res.json({ message: 'File restored successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search files
// @route   GET /api/files/search
const searchFiles = async (req, res) => {
  try {
    const { name, department, course, date } = req.query;

    let query = { isDeleted: false };

    if (req.user.role === 'faculty') {
      query.uploadedBy = req.user._id;
    } else if (req.user.role === 'student') {
      const enrolledCourses = await Course.find({
        students: req.user._id,
      }).select('_id');

      const courseIds = enrolledCourses.map((c) => c._id);

      query.$or = [
        { sharedWith: req.user._id },
        { course: { $in: courseIds }, shareType: 'course' },
      ];
    }

    if (name) query.name = { $regex: name, $options: 'i' };
    if (department) query.department = department;
    if (course) query.course = course;
    if (date) query.createdAt = { $gte: new Date(date) };

    const files = await File.find(query)
      .populate('uploadedBy', 'name email')
      .populate('course', 'name code')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadFile,
  getAllFiles,
  getFileById,
  downloadFile,
  deleteFile,
  restoreFile,
  searchFiles,
};