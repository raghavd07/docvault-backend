const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard,
  markNotificationRead,
} = require('../controllers/dashboardController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/admin', protect, authorizeRoles('admin'), getAdminDashboard);
router.get('/faculty', protect, authorizeRoles('faculty'), getFacultyDashboard);
router.get('/student', protect, authorizeRoles('student'), getStudentDashboard);
router.put('/notifications/:id/read', protect, markNotificationRead);

module.exports = router;