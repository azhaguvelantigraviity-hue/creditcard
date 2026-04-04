const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['New', 'Interested', 'Not Interested', 'Converted', 'Follow Up'],
        default: 'New'
    },
    cardType: {
        type: String,
        enum: ['Card 1', 'Card 2', 'Card 3'],
        default: 'Card 1'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: [
        {
            text: String,
            date: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true
});

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
