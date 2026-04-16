const express = require('express');
const router = express.Router();
const {
  shareWithStudents,
  shareWithCourse,
  makePrivate,
} = require('../controllers/shareController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.put('/:fileId/specific', protect, authorizeRoles('admin', 'faculty'), shareWithStudents);
router.put('/:fileId/course', protect, authorizeRoles('admin', 'faculty'), shareWithCourse);
router.put('/:fileId/private', protect, authorizeRoles('admin', 'faculty'), makePrivate);

module.exports = router;