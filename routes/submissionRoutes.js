const express = require('express');
const router = express.Router();
const {
  submitAssignment,
  getSubmissions,
  getSubmissionById,
  downloadSubmission,
  deleteSubmission,
} = require('../controllers/submissionController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../config/multer');

router.get('/', protect, getSubmissions);
router.get('/:id', protect, getSubmissionById);
router.get('/:id/download', protect, downloadSubmission);
router.post('/', protect, authorizeRoles('student'), upload.single('file'), submitAssignment);
router.delete('/:id', protect, deleteSubmission);

module.exports = router;