const express = require('express')
const router = express.Router()
const {signup, login} = require('../controllers/authController.js')
const refreshTokenController = require('../controllers/refreshTokenController.js')
const asyncHandler = require('../utils/asyncHandler.js')

router.post('/auth/signup',asyncHandler(signup))
router.post('/auth/login',asyncHandler(login))
router.get('/auth/refresh', asyncHandler(refreshTokenController))

module.exports = router;