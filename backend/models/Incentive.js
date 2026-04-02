const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema({
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        default: 1500, // Standard ₹1,500 per card
        required: true
    },
    status: {
        type: String,
        enum: ['Credited', 'Pending', 'Processing'],
        default: 'Pending'
    },
    payoutDate: {
        type: Date
    }
}, {
    timestamps: true
});

const Incentive = mongoose.model('Incentive', incentiveSchema);
module.exports = Incentive;
