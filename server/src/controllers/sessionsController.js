const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/UserModel.js')
const SessionModel = require('../models/SessionModel.js')
const ApiError = require('../utils/apiError.js')



const getAllDevices = async (req,res) => {
    if(!req.user.userId || !req.user.sessionId){
        throw new ApiError(400,"You are logged out already !")
    }
    const sessions = await SessionModel.find(
        {userId: req.user.userId, _id: req.user.sessionId},
        {isRevoked: {$ne: true}}
    ).select('-userId -refreshTokenHash -expiresAt')
    if(!session){
        throw new ApiError(400,"Session already logged out !")
    }

    const formattedSessions = sessions.map(session => ({
        ...sessions.toObject(),
        isCurrent: sessions._id.toString() === req.user.sessionId
    }))

    return res
    .status(200)
    .json({
        message:"All active sessions",
        activeSessions: formattedSessions,
    });
}

const logoutAllDevices = async (req,res) => {
    if(!req.user.userId || !req.user.sessionId){
        throw new ApiError(400,"You are logged out already !")
    }
    const session = await SessionModel.findByIdAndUpdate(
        {userId: req.user.userId, _id: req.user.sessionId},
        {isRevoked: true}
    )
    if(!session){
        throw new ApiError(400,"Session Expired re-login required !")
    }
    res.clearCookie("refreshToken",{httpOnly: true, secure: false, sameSite: true})
    .status(200)
    .json({message:"logged out from all devices"})
}

const logoutFromOneDevice = async (req, res) => {
    const id = req.params.sessionid;
    if(!id){
        throw new ApiError(400,"invalid session, cannot logout !")
    }
    const session = await SessionModel.updateOne(
        {userId: req.user.userId, _id: id},
        {isRevoked: true}
    )
    if(!session){
        throw new ApiError(400,"session not found !")
    }
    res.clearCookie("refreshToken",{sameSite: true, httpOnly:true, secure: false})
    .status(200)
    .json({message:`logged out from ${session.device} successfully !`})
}

module.exports = {
    getAllDevices,
    logoutFromOneDevice,
    logoutAllDevices
}