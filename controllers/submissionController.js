const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Course = require('../models/Course');

// @desc    Submit assignment
// @route   POST /api/submissions
const submitAssignment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, course } = req.body;

    if (!title || !course) {
      return res.status(400).json({ message: 'Please provide title and course' });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc || courseDoc.isDeleted) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!courseDoc.students.includes(req.user._id)) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    const submission = await Submission.create({
      student: req.user._id,
      course,
      title,
      description,
      file: {
        name: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'submit',
      description: `${req.user.name} submitted assignment ${title}`,
      resourceId: submission._id,
    });

    const facultyNotifications = courseDoc.faculty.map((facultyId) => ({
      recipient: facultyId,
      sender: req.user._id,
      type: 'assignment_submitted',
      message: `${req.user.name} submitted assignment "${title}" in ${courseDoc.name}`,
      resourceId: submission._id,
    }));
    await Notification.insertMany(facultyNotifications);

    res.status(201).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get submissions (role based)
// @route   GET /api/submissions
const getSubmissions = async (req, res) => {
  try {
    let query = { isDeleted: false };

    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'faculty') {
      const courses = await Course.find({ faculty: req.user._id });
      const courseIds = courses.map((c) => c._id);
      query.course = { $in: courseIds };
    }

    const submissions = await Submission.find(query)
      .populate('student', 'name email')
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name email')
      .populate('course', 'name code');

    if (!submission || submission.isDeleted) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (
      req.user.role === 'student' &&
      submission.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download submission file
// @route   GET /api/submissions/:id/download
const downloadSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('course');

    if (!submission || submission.isDeleted) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (req.user.role === 'student' &&
      submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (submission.file.path.startsWith('http')) {
      res.redirect(submission.file.path);
    } else {
      const path = require('path');
      res.download(path.resolve(submission.file.path), submission.file.originalName);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Soft delete submission
// @route   DELETE /api/submissions/:id
const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission || submission.isDeleted) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (req.user.role !== 'admin' &&
      submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    submission.isDeleted = true;
    await submission.save();

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitAssignment,
  getSubmissions,
  getSubmissionById,
  downloadSubmission,
  deleteSubmission,
};