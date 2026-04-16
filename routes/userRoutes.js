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
router.use(authorizeRoles('admin'));

router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/deactivate', deactivateUser);
router.delete('/:id', deleteUser);

router.put('/:id/reset-password', resetPassword);
router.put('/:id/reactivate', reactivateUser);
module.exports = router;