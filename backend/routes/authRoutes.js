const express = require('express');
const router = express.Router();
const { checkEmail, verifyOtp, adminLogin, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/check-email', checkEmail);
router.post('/verify-otp', verifyOtp);
router.post('/admin-login', adminLogin);
router.post('/logout', requireAuth, logout);

module.exports = router;
