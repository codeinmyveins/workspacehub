const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otpHash: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        required: true,
        default: 0
    },
    expiresAt: {
        type: Date,
    }
}, { timestamps: true });

module.exports = mongoose.model("OtpModel", OtpSchema);


