const crypto = require('crypto')
const UserModel = require('../models/UserModel.js')
const ApiError = require('../utils/apiError.js')
const sendEmail = require('../utils/emailSender.js')
const resetPasswordTemplate = require('../templates/passwordResetTemplate.js')

const forgotPasswordController = async (req, res) =>{
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

module.exports = forgotPasswordController;