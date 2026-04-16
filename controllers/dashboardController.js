const User = require('../models/User');
const File = require('../models/File');
const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const Department = require('../models/Department');

// @desc    Admin dashboard
// @route   GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const totalFaculty = await User.countDocuments({ role: 'faculty', isDeleted: false });
    const totalStudents = await User.countDocuments({ role: 'student', isDeleted: false });
    const totalFiles = await File.countDocuments({ isDeleted: false });
    const totalSubmissions = await Submission.countDocuments({ isDeleted: false });
    const totalDepartments = await Department.countDocuments({ isDeleted: false });
    const totalCourses = await Course.countDocuments({ isDeleted: false });

    const recentLogs = await ActivityLog.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);

    const uploadTrends = await File.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]);

    const mostDownloaded = await File.find({ isDeleted: false })
      .sort({ downloadCount: -1 })
      .limit(5)
      .populate('uploadedBy', 'name');

    res.json({
      stats: {
        totalUsers,
        totalFaculty,
        totalStudents,
        totalFiles,
        totalSubmissions,
        totalDepartments,
        totalCourses,
      },
      recentLogs,
      uploadTrends,
      mostDownloaded,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Faculty dashboard
// @route   GET /api/dashboard/faculty
const getFacultyDashboard = async (req, res) => {
  try {
    const uploadedFiles = await File.countDocuments({
      uploadedBy: req.user._id,
      isDeleted: false,
    });

    const courses = await Course.find({ faculty: req.user._id, isDeleted: false });
    const courseIds = courses.map((c) => c._id);

    const totalSubmissions = await Submission.countDocuments({
      course: { $in: courseIds },
      isDeleted: false,
    });

    const recentSubmissions = await Submission.find({
      course: { $in: courseIds },
      isDeleted: false,
    })
      .populate('student', 'name email')
      .populate('course', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    const fileDownloadStats = await File.find({
      uploadedBy: req.user._id,
      isDeleted: false,
    })
      .select('name downloadCount')
      .sort({ downloadCount: -1 })
      .limit(5);

    const notifications = await Notification.find({
      recipient: req.user._id,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        uploadedFiles,
        totalCourses: courses.length,
        totalSubmissions,
      },
      recentSubmissions,
      fileDownloadStats,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Student dashboard
// @route   GET /api/dashboard/student
const getStudentDashboard = async (req, res) => {
  try {
    const sharedFiles = await File.countDocuments({
      isDeleted: false,
      $or: [
        { sharedWith: req.user._id },
        { course: { $in: req.user.courses }, shareType: 'course' },
      ],
    });

    const mySubmissions = await Submission.countDocuments({
      student: req.user._id,
      isDeleted: false,
    });

    const recentFiles = await File.find({
      isDeleted: false,
      $or: [
        { sharedWith: req.user._id },
        { course: { $in: req.user.courses }, shareType: 'course' },
      ],
    })
      .populate('uploadedBy', 'name')
      .populate('course', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentSubmissions = await Submission.find({
      student: req.user._id,
      isDeleted: false,
    })
      .populate('course', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    const notifications = await Notification.find({
      recipient: req.user._id,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        sharedFiles,
        mySubmissions,
        totalCourses: req.user.courses.length,
      },
      recentFiles,
      recentSubmissions,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/dashboard/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard,
  markNotificationRead,
};