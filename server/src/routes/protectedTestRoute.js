const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware.js')

router
.get('/test-route',authMiddleware,(req,res)=>{
    try {
        res.json({msg:"you are authenticated"})
    } catch (error) {
        res.json({msg:"accessToken expired bro !",error:error})
    }
})

module.exports = router;