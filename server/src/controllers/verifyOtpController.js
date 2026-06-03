const UserModel = require('../models/UserModel.js');
const OtpModel = require("../models/OtpModel.js");
const ApiError = require('../utils/apiError');
const bcrypt = require("bcrypt")
const crypto = require("crypto");

async function verifyOtp(req, res) {
    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
        throw new ApiError(400, "All fields are required!");
    }

    if (!await OtpModel.findOneAndUpdate({ email }, { $inc: { attempt: 1 } })) {
        throw new ApiError(400, "Invalid Email")
    }

    const otpDetailes = await OtpModel.findOne({ email, otpHash: crypto.createHash("sha256").update(otp).digest("hex"), expiresAt: { $gt: Date.now() }, attempts: { $lt: 3 } }, );
    
    if (!otpDetailes) {
        throw new ApiError(400, "Invalid or expired OTP!");
    };

    await OtpModel.findOneAndDelete({ email }, { attempt: { $eq: 3 } });
    
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.SALT));
    await UserModel.create({
        email: email,
        passwordHash: passwordHash
    });
    res.status(201).json({ message: "Signup successful! Please login." });
}

module.exports = verifyOtp;