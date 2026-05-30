const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const UserModel = require('../models/UserModel.js')
const SessionModel = require('../models/SessionModel.js')

const refreshTokenController = async (req, res) => {
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
        sameSite: false, // true in prod
        strict: true,
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

module.exports = refreshTokenController;