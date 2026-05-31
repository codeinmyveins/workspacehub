const crypto = require('crypto')
const bcrypt = require('bcrypt')
const ApiError = require('../utils/apiError.js')
const UserModel = require('../models/UserModel.js')
const SessionModel = require('../models/SessionModel.js')


const resetPasswordController = async (req, res) => {
    const resetToken = req.params.resetToken;
    if (!resetToken){
        throw new ApiError(404, "Click the password-reset link sent to your email")
    }
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const user = await UserModel.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: {$gt: Date.now()}
    }, {_id: 1})
    console.log(user)
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
    .clearCookie("refreshToken",{httpOnly: true, sameSite: false, strict: true})
    .status(200)
    .json({
        success: true,
        message: "Password reset successful. Please login again."
    });
}
module.exports = resetPasswordController;