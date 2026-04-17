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
} = require('../controllers/courseController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', protect, getAllCourses);
router.get('/:id', protect, getCourseById);
router.post('/', protect, authorizeRoles('admin'), createCourse);
router.put('/:id/assign-faculty', protect, authorizeRoles('admin'), assignFaculty);
router.put('/:id/enroll-student', protect, authorizeRoles('admin'), enrollStudent);
router.put('/:id', protect, authorizeRoles('admin'), updateCourse);
router.delete('/:id', protect, authorizeRoles('admin'), deleteCourse);

module.exports = router;