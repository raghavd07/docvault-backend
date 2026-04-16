const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create department
// @route   POST /api/departments
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide department name' });
    }

    const departmentExists = await Department.findOne({ name, isDeleted: false });
    if (departmentExists) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = await Department.create({ name, description });

    await ActivityLog.create({
      user: req.user._id,
      action: 'create_department',
      description: `Admin created department ${name}`,
      resourceId: department._id,
    });

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isDeleted: false });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department || department.isDeleted) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
const updateDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department || department.isDeleted) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name) department.name = name;
    if (description) department.description = description;

    await department.save();

    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Soft delete department
// @route   DELETE /api/departments/:id
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department || department.isDeleted) {
      return res.status(404).json({ message: 'Department not found' });
    }

    department.isDeleted = true;
    await department.save();

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};