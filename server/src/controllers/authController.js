const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/UserModel.js')
const SessionModel = require('../models/SessionModel.js')
const OtpModel = require("../models/OtpModel.js")
const ApiError = require('../utils/apiError.js')
const crypto = require("crypto");
const generateOtp = require("../utils/generateOtp.js")
const sendEmail = require('../utils/emailSender.js')
const otpTemplate = require("../templates/otpTemplate.js")

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
        sameSite: false,
        strict: true
    })
    .status(200)
    .json({message:"Login Successfull !", accessToken: accessToken})
}


module.exports = {signup, login}