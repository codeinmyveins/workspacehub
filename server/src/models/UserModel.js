const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        sparse: true // allow multiple undefined/null values
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    passwordResetTokenHash: {
        type: String,
        default: null
    },
    passwordResetTokenExpiresAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema)

module.exports = User;