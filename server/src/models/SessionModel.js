const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    refreshTokenHash: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    device: {
        type: String,
        required: true
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const Session = mongoose.model("Session", SessionSchema);

module.exports = Session;