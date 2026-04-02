const Incentive = require('../models/Incentive');
const mongoose = require('mongoose');

// @desc    Get aggregate incentive stats for the dashboard
// @route   GET /api/incentives/stats
// @access  Private
const getIncentiveStats = async (req, res) => {
    try {
        const stats = await Incentive.aggregate([
            { $match: { sellerId: new mongoose.Types.ObjectId(req.user._id) } },
            { 
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$amount' },
                    credited: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Credited'] }, '$amount', 0] } 
                    },
                    pending: { 
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0] } 
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const defaultStats = {
            totalEarnings: 0,
            credited: 0,
            pending: 0,
            count: 0
        };

        res.json(stats.length > 0 ? stats[0] : defaultStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed incentive ledger with product names
// @route   GET /api/incentives/ledger
// @access  Private
const getIncentiveLedger = async (req, res) => {
    try {
        const ledger = await Incentive.find({ sellerId: req.user._id })
            .populate({
                path: 'saleId',
                populate: { path: 'leadId', select: 'name phoneNumber' }
            })
            .sort({ createdAt: -1 });

        // Map to cleaner format for frontend
        const formattedLedger = ledger.map(item => ({
            id: item._id,
            name: item.saleId?.leadId?.name || 'Unknown Client',
            product: item.saleId?.cardType || 'SBI Card',
            date: item.createdAt.toISOString().split('T')[0],
            amount: `₹${item.amount.toLocaleString()}`,
            status: item.status
        }));

        res.json(formattedLedger);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get monthly performance stats for charts
// @route   GET /api/incentives/monthly
// @access  Private
const getMonthlyIncentiveStats = async (req, res) => {
    try {
        const monthly = await Incentive.aggregate([
            { $match: { sellerId: new mongoose.Types.ObjectId(req.user._id) } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Map month numbers to names
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedMonthly = monthly.map(item => ({
            name: monthNames[item._id - 1],
            amount: item.total
        }));

        res.json(formattedMonthly);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getIncentiveStats,
    getIncentiveLedger,
    getMonthlyIncentiveStats
};
