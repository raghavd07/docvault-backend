const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', protect, getAllDepartments);
router.get('/:id', protect, getDepartmentById);
router.post('/', protect, authorizeRoles('admin'), createDepartment);
router.put('/:id', protect, authorizeRoles('admin'), updateDepartment);
router.delete('/:id', protect, authorizeRoles('admin'), deleteDepartment);

module.exports = router;