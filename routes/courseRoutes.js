const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  assignFaculty,
  enrollStudent,
  deleteCourse,
  updateCourse,
  submitEnrollmentRequest,
  getEnrollmentRequests,
  approveEnrollmentRequest,
  rejectEnrollmentRequest,
} = require('../controllers/courseController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', protect, getAllCourses);
router.get('/enrollment-requests', protect, authorizeRoles('admin'), getEnrollmentRequests);
router.post('/enroll-request', protect, authorizeRoles('student'), submitEnrollmentRequest);
router.put('/enrollment-requests/:id/approve', protect, authorizeRoles('admin'), approveEnrollmentRequest);
router.put('/enrollment-requests/:id/reject', protect, authorizeRoles('admin'), rejectEnrollmentRequest);

router.get('/:id', protect, getCourseById);
router.post('/', protect, authorizeRoles('admin'), createCourse);
router.put('/:id/assign-faculty', protect, authorizeRoles('admin'), assignFaculty);
router.put('/:id', protect, authorizeRoles('admin'), updateCourse);
router.delete('/:id', protect, authorizeRoles('admin'), deleteCourse);

module.exports = router;