const express = require('express');
const router = express.Router();
const {
  uploadFile,
  getAllFiles,
  getFileById,
  downloadFile,
  deleteFile,
  restoreFile,
  searchFiles,
} = require('../controllers/fileController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../config/multer');

router.get('/search', protect, searchFiles);
router.get('/', protect, getAllFiles);
router.get('/:id', protect, getFileById);
router.get('/:id/download', protect, downloadFile);
router.post('/upload', protect, authorizeRoles('admin', 'faculty'), upload.single('file'), uploadFile);
router.delete('/:id', protect, deleteFile);
router.put('/:id/restore', protect, authorizeRoles('admin'), restoreFile);

module.exports = router;