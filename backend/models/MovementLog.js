const mongoose = require('mongoose');

const movementLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
        required: true
    },
    exitTime: {
        type: Date,
        required: true
    },
    reEntryTime: {
        type: Date
    },
    reason: {
        type: String,
        enum: ['Personal', 'Official Work', 'Meeting Candidate'],
        required: true
    },
    exitLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    durationMinutes: {
        type: Number,
        default: 0
    },
    deducted: {
        type: Boolean,
        default: false // true only for Personal reason
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MovementLog', movementLogSchema);
