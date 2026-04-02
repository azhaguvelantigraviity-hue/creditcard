const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    outcome: {
        type: String,
        enum: ['No Answer', 'Busy', 'Interested', 'Not Interested', 'Call Back'],
        required: true
    },
    duration: {
        type: String, // e.g. "2m 30s"
        required: false
    },
    notes: String
}, {
    timestamps: true
});

const CallLog = mongoose.model('CallLog', callLogSchema);
module.exports = CallLog;
