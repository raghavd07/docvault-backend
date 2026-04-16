const Course = require('../models/Course');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const EnrollmentRequest = require('../models/EnrollmentRequest');
const Notification = require('../models/Notification');

// @desc    Create course
// @route   POST /api/courses
const createCourse = async (req, res) => {
  try {
    const { name, code, description, department } = req.body;

    if (!name || !code || !department) {
      return res.status(400).json({ message: 'Please provide name, code and department' });
    }

    const courseExists = await Course.findOne({ code, isDeleted: false });
    if (courseExists) {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }

    const course = await Course.create({ name, code, description, department });

    await ActivityLog.create({
      user: req.user._id,
      action: 'create_course',
      description: `Admin created course ${name}`,
      resourceId: course._id,
    });

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: false })
      .populate('department', 'name')
      .populate('faculty', 'name email')
      .populate('students', 'name email');

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'name')
      .populate('faculty', 'name email')
      .populate('students', 'name email');

    if (!course || course.isDeleted) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Assign faculty to course
// @route   PUT /api/courses/:id/assign-faculty
const assignFaculty = async (req, res) => {
  try {
    const { facultyId } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course || course.isDeleted) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (course.faculty.includes(facultyId)) {
      return res.status(400).json({ message: 'Faculty already assigned to this course' });
    }

    course.faculty.push(facultyId);
    await course.save();

    if (!faculty.courses.includes(course._id)) {
      faculty.courses.push(course._id);
      await faculty.save();
    }

    res.json({ message: 'Faculty assigned successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit enrollment request
// @route   POST /api/courses/enroll-request
const submitEnrollmentRequest = async (req, res) => {
  try {
    const { courseIds } = req.body;
    if (!courseIds || courseIds.length === 0) {
      return res.status(400).json({ message: 'No courses selected' });
    }

    const request = await EnrollmentRequest.create({
      student: req.user._id,
      courses: courseIds,
    });

    res.status(201).json({ message: 'Enrollment request submitted', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all enrollment requests
// @route   GET /api/courses/enrollment-requests
const getEnrollmentRequests = async (req, res) => {
  try {
    const requests = await EnrollmentRequest.find()
      .populate('student', 'name email department')
      .populate('courses', 'name code')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve enrollment request
// @route   PUT /api/courses/enrollment-requests/:id/approve
const approveEnrollmentRequest = async (req, res) => {
  try {
    const request = await EnrollmentRequest.findById(req.params.id)
      .populate('courses', '_id')
      .populate('student', '_id courses role');

    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    const student = await User.findById(request.student._id);

    for (const c of request.courses) {
      const course = await Course.findById(c._id);
      if (course) {
        if (!course.students.includes(student._id)) {
          course.students.push(student._id);
          await course.save();
        }
        if (!student.courses.includes(course._id)) {
          student.courses.push(course._id);
        }
      }
    }
    await student.save();

    request.status = 'approved';
    await request.save();

    res.json({ message: 'Request approved successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject enrollment request
// @route   PUT /api/courses/enrollment-requests/:id/reject
const rejectEnrollmentRequest = async (req, res) => {
  try {
    const request = await EnrollmentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Request rejected successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Soft delete course
// @route   DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.isDeleted) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.isDeleted = true;
    await course.save();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { name, code, description, department } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course || course.isDeleted) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (name) course.name = name;
    if (code) course.code = code;
    if (description) course.description = description;
    if (department) course.department = department;
    await course.save();
    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  assignFaculty,
  submitEnrollmentRequest,
  getEnrollmentRequests,
  approveEnrollmentRequest,
  rejectEnrollmentRequest,
  deleteCourse,
  updateCourse
};