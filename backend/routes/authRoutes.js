const express = require('express');
const router = express.Router();
const { checkPhone, verifyOtp, adminLogin } = require('../controllers/authController');

router.post('/check-phone', checkPhone);
router.post('/verify-otp', verifyOtp);
router.post('/admin-login', adminLogin);

module.exports = router;
