const express = require('express')
const router = express.Router()
const asyncHandler = require('../utils/asyncHandler.js')
const authMiddleware = require('../middlewares/authMiddleware.js')
const {
    getAllDevices,
    logoutFromOneDevice,
    logoutAllDevices
} = require('../controllers/sessionsController.js')

router.get('/auth/get-all-devices',authMiddleware,asyncHandler(getAllDevices))
router.post('/auth/logout-all-devices',authMiddleware, asyncHandler(logoutFromOneDevice))
router.post('/auth/logout/:sessionid',authMiddleware, asyncHandler(logoutAllDevices))

module.exports = router;
