const User = require('../models/User');
const bcrypt = require('bcryptjs');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// @desc    Create a new user
// @route   POST /api/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (!['faculty', 'student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be faculty, student or admin' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department: role === 'admin' ? null : department || null,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'create_user',
      description: `Admin created user ${name} with role ${role}`,
      resourceId: user._id,
    });

    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: 'account_created',
      message: `Welcome ${name}! Your account has been created.`,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false })
      .select('-password')
      .populate('department', 'name')
      .populate('courses', 'name code');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('department', 'name')
      .populate('courses', 'name code');

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, email, department, courses } = req.body;

    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (department !== undefined) user.department = department;
    if (courses) user.courses = courses;

    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'update_user',
      description: `Admin updated user ${user.name}`,
      resourceId: user._id,
    });

    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: 'account_updated',
      message: `Your account details have been updated.`,
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'deactivate_user',
      description: `Admin deactivated user ${user.name}`,
      resourceId: user._id,
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Soft delete user
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please provide a new password' });
    }

    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reactivate user
// @route   PUT /api/users/:id/reactivate
const reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'User reactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  reactivateUser,
  deleteUser,
  resetPassword,
};