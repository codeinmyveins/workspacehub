const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/UserModel.js')
const SessionModel = require('../models/SessionModel.js')
const ApiError = require('../utils/apiError.js')

const signup = async (req, res) => { 
    const {email, password} = req.body;
    if (!email || !password) {
        throw new ApiError(400, "email and password are required !")
    }
    const user = await UserModel.findOne({email});
    if (user) {
        throw new ApiError(400, "Invalid Email or Password !")
    }
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.SALT));
    await UserModel.create({
        email: email,
        passwordHash: passwordHash
    });
    res.status(200).json({message:"User created successfully :)"})
}

const login = async (req,res) => {
    const {email, password} = req.body;
    
    if (!email || !password) {
        throw new ApiError(400, "All fields are required !")
    }
    
    const user = await UserModel.findOne({email})
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    
    if (!user || !isMatch) {
        throw new ApiError(400, "Invalid email or password !")
    }
    
    
    const session = await SessionModel.create({
        userId: user._id,
        ip: req.ip || 'Unknown',
        device: req.headers['User-Agent'] || 'Unknown',
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