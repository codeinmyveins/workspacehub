const bcrypt = require('bcrypt');
const UserModel = require('../models/UserModel.js')
const SessionModel = require('../models/SessionModel.js')
const ApiError = require('../utils/apiError.js')

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
    res.clearCookie("refreshToken",{httpOnly: true, sameSite: false, strict: true});

    return res.status(200)
    .json({msg:"Password changed successfully, Re-login required !"})
}

module.exports = changePassword;