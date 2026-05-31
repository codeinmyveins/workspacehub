const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware.js')
const asyncHandler = require('../utils/asyncHandler.js')

router
.get('/test-route',authMiddleware,asyncHandler((req,res)=>{
    try {
        res.status(200).json({message:"you are authenticated"})
    } catch (error) {
        throw new ApiError(401, "Access Token not found !")
    }
}))

module.exports = router;