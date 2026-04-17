const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  reactivateUser,
  deleteUser,
  resetPassword,
} = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);
router.post('/', authorizeRoles('admin'), createUser);
router.get('/', authorizeRoles('admin', 'faculty'), getAllUsers);
router.get('/:id', authorizeRoles('admin', 'faculty'), getUserById);
router.put('/:id', authorizeRoles('admin'), updateUser);
router.put('/:id/deactivate', authorizeRoles('admin'), deactivateUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

router.put('/:id/reset-password', authorizeRoles('admin'), resetPassword);
router.put('/:id/reactivate', authorizeRoles('admin'), reactivateUser);
module.exports = router;