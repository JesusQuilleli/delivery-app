const express = require('express');
const router = express.Router();
const { checkEmail, verifyOtp, adminLogin, logout, refreshToken } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { authLimiter, adminLoginLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { checkEmailSchema, verifyOtpSchema, adminLoginSchema } = require('../validations/authValidation');

router.post('/check-email', authLimiter, validate(checkEmailSchema), checkEmail);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/admin-login', adminLoginLimiter, validate(adminLoginSchema), adminLogin);
router.post('/refresh', refreshToken);
router.post('/logout', requireAuth, logout);

module.exports = router;
