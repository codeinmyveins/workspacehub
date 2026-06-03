const express = require('express')
const router = express.Router()
const asyncHandler = require('../utils/asyncHandler.js')
const authMiddleware = require('../middlewares/authMiddleware.js')
const {
    signup,
    login,
    logout,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword
} = require('../controllers/authController.js')
const verifyOtp = require('../controllers/verifyOtpController.js')

router.post('/auth/signup',asyncHandler(signup))
router.post('/auth/verify-otp', asyncHandler(verifyOtp))
router.post('/auth/login',asyncHandler(login))
router.post('/auth/logout', authMiddleware, asyncHandler(logout))
router.get('/auth/refresh', asyncHandler(refreshToken))
router.post('/auth/change-password', authMiddleware, asyncHandler(changePassword))
router.post('/auth/forgot-password', asyncHandler(forgotPassword))
router.post('/auth/reset-password/:resetToken', asyncHandler(resetPassword))

module.exports = router;
