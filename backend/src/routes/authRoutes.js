const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  directNITPSignIn,
  getUserProfile,
  forgotPassword,
  updateUserProfile,
  sendOtp,
  verifyOtp,
  forgotPasswordWithOtp,
  changePasswordWithOtp,
  verifyEmail,
  resendEmailOtp,
  sendPhoneOtp,
  verifyPhone,
  verifySubscriptionViaToken,
  getAdminSellers,
  verifySellerById,
  resubmitSellerPayment,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { otpRateLimiter, verifyRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', otpRateLimiter, registerUser);
router.post('/login', loginUser);
router.post('/nitp-direct', otpRateLimiter, directNITPSignIn);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getUserProfile);

// Admin & Seller Subscription Management
router.get('/admin/verify-subscription', verifySubscriptionViaToken);
router.get('/admin/sellers', protect, getAdminSellers);
router.post('/admin/verify-seller/:id', protect, verifySellerById);
router.post('/seller/resubmit-payment', resubmitSellerPayment);

// Email Verification & Rate-Limited OTP
router.post('/verify-email', verifyRateLimiter, verifyEmail);
router.post('/resend-otp', otpRateLimiter, resendEmailOtp);

// Phone Verification (Protected)
router.post('/send-phone-otp', protect, otpRateLimiter, sendPhoneOtp);
router.post('/verify-phone', protect, verifyRateLimiter, verifyPhone);

// Profile & OTP Security
router.put('/profile', protect, updateUserProfile);
router.post('/send-otp', otpRateLimiter, sendOtp);
router.post('/verify-otp', verifyRateLimiter, verifyOtp);
router.post('/forgot-password-otp', verifyRateLimiter, forgotPasswordWithOtp);
router.post('/change-password-otp', protect, verifyRateLimiter, changePasswordWithOtp);

module.exports = router;
