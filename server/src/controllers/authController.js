const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/UserModel.js')
const SessionModel = require('../models/SessionModel.js')
const OtpModel = require("../models/OtpModel.js")
const ApiError = require('../utils/apiError.js')
const crypto = require("crypto");
const generateOtp = require("../utils/generateOtp.js")
const otpTemplate = require("../templates/otpTemplate.js")
const sendEmail = require('../utils/emailSender.js')
const resetPasswordTemplate = require('../templates/passwordResetTemplate.js')

const signup = async (req, res) => { 
    const {email } = req.body;
    if (!email) {
        throw new ApiError(400, "email is required !")
    }
    const user = await UserModel.findOne({email});
    if (user) {
        throw new ApiError(400, "Invalid Email or Password !")
    }
    const otp = generateOtp().toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await OtpModel.create({
        email: email,
        otpHash: otpHash,
        expiresAt: new Date(Date.now() + 3 * 60 * 1000)
    });
    
    await sendEmail({
        to: email,
        subject: "verify your Email",
        html: otpTemplate(otp)
    });

    // const passwordHash = await bcrypt.hash(password, parseInt(process.env.SALT));
    // await UserModel.create({
    //     email: email,
    //     passwordHash: passwordHash
    // });
    res.status(200).json({message:"otp has sended to your email :)"})
}

const login = async (req,res) => {
    const {email, password} = req.body;
    
    if (!email || !password) {
        throw new ApiError(400, "All fields are required !")
    }
    
    const user = await UserModel.findOne({email})
    if (!user) {
        throw new ApiError(400, "Invalid email or password !")
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
        throw new ApiError(400, "Invalid email or password !")
    }
    
    
    
    const session = await SessionModel.create({
        userId: user._id,
        ip: req.ip || 'Unknown',
        device: req.headers['user-agent'] || 'Unknown',
        refreshTokenHash: 'temporary',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    
    const accessToken = jwt.sign({userId: user._id, sessionId: session._id}, process.env.ACCESS_TOKEN_SIGNATURE, {expiresIn: '15m'})
    const refreshToken = jwt.sign({userId: user._id, sessionId: session._id}, process.env.REFRESH_TOKEN_SIGNATURE,{expiresIn: '7d'})
    
    session.refreshTokenHash = await bcrypt.hash(refreshToken, parseInt(process.env.SALT))
    await session.save()

    return res
    .cookie("refreshToken",refreshToken,{
        httpOnly: true,
        maxAge: 7*24*60*60*1000,
        sameSite: true,
        secure: true
    })
    .status(200)
    .json({message:"Login Successfull !", accessToken: accessToken})
}

const logout = async (req, res) => {
    if(!req.user.userId || !req.user.sessionId){
        throw new ApiError(400,"you are not logged in !")
    }

    const session = await SessionModel.updateOne(
        {userId: req.user.userId, _id: req.user.sessionId},
        {isRevoked: true}
    )
    if(!session){
        throw new ApiError(400,"session not found !")
    }
    res.clearCookie("refreshToken",{sameSite: true, httpOnly:true, secure: false})
    .status(200)
    .json({message:"you are logged out !"})
}

const refreshToken = async (req, res) => {
    const currRefreshToken = req.cookies.refreshToken;
    if(!currRefreshToken){
        throw new ApiError(401, "Please login to access this resource !")
    }
    // verify old token
    const decoded = await jwt.verify(currRefreshToken, process.env.REFRESH_TOKEN_SIGNATURE)
    // check user exist
    const user = await UserModel.findById(decoded.userId)
    if(!user){
        throw new ApiError(401, "User Not Found !")
    }
    // validate session
    const session = await SessionModel.findById(decoded.sessionId)
    if(!session || session.isRevoked || session.expiresAt < new Date()){
        throw new ApiError(400, "Session Not Found !")
    }
    // verify refresh token with stored token
    const isMatch = await bcrypt.compare(currRefreshToken, session.refreshTokenHash);
    if(!isMatch){ // chance of token reuse so revoke session and force login
        throw new ApiError(400, "Session Revoked !")
        session.isRevoked = true;
        res.clearCookie("refreshToken");
    }

    const newAccessToken = jwt.sign({userId: user._id, sessionId: session._id},process.env.ACCESS_TOKEN_SIGNATURE,{expiresIn: '15m'});
    const newRefreshToken = jwt.sign({userId: user._id, sessionId: session._id},process.env.REFRESH_TOKEN_SIGNATURE,{expiresIn: '7d'});
    
    session.refreshTokenHash = await bcrypt.hash(newRefreshToken, parseInt(process.env.SALT));
    await session.save()

    res
    .cookie("refreshToken",newRefreshToken,{
        httpOnly: true,
        sameSite: true,
        secure: false,
        maxAge: new Date(
            Date.now() + 7*24*60*60*1000 // 7d
        )
    })
    .status(200)
    .json({
        message:"refreshed !",
        accessToken: newAccessToken
    })
}

const changePassword = async (req, res) => {
    const {userId, sessionId} = req.user;
    const {password, newPassword} = req.body;

    if (!userId || !sessionId || !newPassword || !password){
        throw new ApiError(400, "error changing password !")
    }
    
    const user = await UserModel.findById(userId);
    if (!user){
        throw new ApiError(404, "User Not Found !")
    }
    
    const session = await SessionModel.findById(sessionId);
    if (!session){
        throw new ApiError(404, "Session Not Found !")
    }
    
    const isMatch = await bcrypt.compare(password,user.passwordHash)
    if(!isMatch){
        throw new ApiError(400,"Invalid current password !")
    }

    user.passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.SALT))
    await user.save()

    // log out from all devices
    await SessionModel.findByIdAndUpdate(userId, {
        isRevoked: true
    })
    res.clearCookie("refreshToken",{httpOnly: true, sameSite: true, secure: false});

    return res.status(200)
    .json({msg:"Password changed successfully, Re-login required !"})
}

const forgotPassword = async (req, res) =>{
    const {email} = req.body;
    if (!email){
        throw new ApiError(400,"email is required !")
    }
    const user = await UserModel.findOne({email})
    if(!user){
        throw new ApiError(404,"invalid email")
    }
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetTokenHash = crypto.createHash('sha256').update(passwordResetToken).digest('hex');
    
    user.passwordResetTokenHash = passwordResetTokenHash;
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const passwordresetLink = `http://localhost:5000/api/v1/password-reset-link/${passwordResetToken}`
    console.log(passwordResetToken)
    await sendEmail({
        to: user.email,
        subject: 'WorkSpaceHub Password Reset Link',
        html: resetPasswordTemplate(passwordresetLink)
    })

    return res.status(200).json({ message: 'Password reset link sent to your email !' });
};

const resetPassword = async (req, res) => {
    const resetToken = req.params.resetToken;
    if (!resetToken){
        throw new ApiError(404, "Click the password-reset link sent to your email")
    }
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const user = await UserModel.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: {$gt: Date.now()}
    }, {_id: 1})
    if(!user){
        throw new ApiError(404, "link expired")
    }
    const {newPassword} = req.body;
    if (!newPassword){
        throw new ApiError(400, "new password required !")
    }
    const newPasswordHash = await bcrypt.hash(newPassword, parseInt(process.env.SALT));
    await UserModel.updateOne(
        { _id: user._id },
        {
            $set: {
            passwordHash: newPasswordHash
            },
            $unset: {
            passwordResetTokenHash: "",
            passwordResetTokenExpiresAt: ""
            }
        }
    );
    await SessionModel.updateMany(
        {userId: user._id},
        {isRevoked: true}
    );
    
    return res
    .clearCookie("refreshToken",{httpOnly: true, sameSite: true, strict: true})
    .status(200)
    .json({
        success: true,
        message: "Password reset successful. Please login again."
    });
}

module.exports = {
    signup,
    login,
    logout,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword
}
