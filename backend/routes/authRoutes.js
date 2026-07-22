const express = require('express');
const router = express.Router();
const { checkEmail, verifyOtp, adminLogin } = require('../controllers/authController');

router.post('/check-email', checkEmail);
router.post('/verify-otp', verifyOtp);
router.post('/admin-login', adminLogin);

module.exports = router;
