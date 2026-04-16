const express = require('express');
const router = express.Router();
const { checkAdmin, setupAdmin, login, getMe, logout, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/check-admin', checkAdmin);
router.post('/setup', setupAdmin);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router;