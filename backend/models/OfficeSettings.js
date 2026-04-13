const mongoose = require('mongoose');

const officeSettingsSchema = new mongoose.Schema({
    officeLat: {
        type: Number,
        default: 12.961019 // Default: Nagarabhavi, Bengaluru
    },
    officeLng: {
        type: Number,
        default: 77.512684 // Default: Nagarabhavi, Bengaluru
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
    // NIGHT SHIFT SETTINGS
    nightStartTime: {
        type: String,
        default: '20:30' // HH:MM
    },
    nightLateThreshold: {
        type: String,
        default: '20:45' // After this → Late
    },
    nightHalfDayThreshold: {
        type: String,
        default: '22:00' // At or after this → Half Day
    },
    nightAutoLogoutTime: {
        type: String,
        default: '05:30' // Auto logout at 5:30 AM
    },
    dailyTarget: {
        type: Number,
        default: 10 // Daily card sales target
    },
    // ADMIN INCENTIVE OPTIONS
    adminIncentiveModel: {
        type: String,
        enum: ['total_sales', 'per_seller', 'percentage'],
        default: 'percentage' // Option 3 as default since it's common
    },
    adminCompanyTarget: {
        type: Number,
        default: 150 // Option 1: total company cards target
    },
    adminIncentivePerExtraSale: {
        type: Number,
        default: 50 // Option 1: payout per extra card
    },
    adminIncentivePerSeller: {
        type: Number,
        default: 100 // Option 2: payout per successful seller
    },
    adminIncentivePercentage: {
        type: Number,
        default: 5 // Option 3: % of total seller payouts
    },
    // SELLER TIERED INCENTIVES
    tierBronzeStart: {
        type: Number,
        default: 11
    },
    tierBronzePayout: {
        type: Number,
        default: 200
    },
    tierSilverStart: {
        type: Number,
        default: 16
    },
    tierSilverPayout: {
        type: Number,
        default: 225
    },
    tierGoldStart: {
        type: Number,
        default: 21
    },
    tierGoldPayout: {
        type: Number,
        default: 250
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('OfficeSettings', officeSettingsSchema);
