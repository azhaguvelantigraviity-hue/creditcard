const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // 'YYYY-MM-DD' for easy querying
        required: true
    },
    loginTime: {
        type: Date
    },
    logoutTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['On Time', 'Late', 'Half Day', 'Absent'],
        default: 'Absent'
    },
    mode: {
        type: String,
        enum: ['office', 'remote'],
        required: true
    },
    loginLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    isActive: {
        type: Boolean,
        default: true // true = currently clocked in
    },
    totalWorkingMinutes: {
        type: Number,
        default: 0
    },
    totalOutsideMinutes: {
        type: Number,
        default: 0 // personal breaks deducted
    },
    logoutReason: {
        type: String,
        enum: ['Personal', 'Official']
    }
}, {
    timestamps: true
});

// One attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
