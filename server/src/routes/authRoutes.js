const express = require('express')
const router = express.Router()
const {signup, login} = require('../controllers/authController.js')
const refreshTokenController = require('../controllers/refreshTokenController.js')
const asyncHandler = require('../utils/asyncHandler.js')
const authMiddleware = require('../middlewares/authMiddleware.js')
const changePasswordController = require('../controllers/changePasswordController.js')
const forgotPasswordController = require('../controllers/forgotPasswordController.js')

router.post('/auth/signup',asyncHandler(signup))
router.post('/auth/login',asyncHandler(login))
router.get('/auth/refresh', asyncHandler(refreshTokenController))
router.post('/auth/change-password', authMiddleware, asyncHandler(changePasswordController))
router.post('/auth/forgot-password', asyncHandler(forgotPasswordController))

module.exports = router;