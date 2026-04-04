const mongoose = require('mongoose');

const officeSettingsSchema = new mongoose.Schema({
    officeLat: {
        type: Number,
        default: 12.9610 // Default: Nagarabhavi, Bengaluru
    },
    officeLng: {
        type: Number,
        default: 77.5127 // Default: Nagarabhavi, Bengaluru
    },
    geofenceRadius: {
        type: Number,
        default: 100 // meters
    },
    loginStartTime: {
        type: String,
        default: '09:30' // HH:MM
    },
    lateThreshold: {
        type: String,
        default: '09:45' // After this → Late
    },
    halfDayThreshold: {
        type: String,
        default: '11:00' // At or after this → Half Day
    },
    autoLogoutTime: {
        type: String,
        default: '18:30' // Auto logout at 6:30 PM
    },
    dailyTarget: {
        type: Number,
        default: 10 // Daily card sales target
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('OfficeSettings', officeSettingsSchema);
