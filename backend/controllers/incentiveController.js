const Incentive = require('../models/Incentive');
const Sale = require('../models/Sale');
const User = require('../models/User');
const OfficeSettings = require('../models/OfficeSettings');
const mongoose = require('mongoose');

// @desc    Get aggregate incentive stats for the seller dashboard
// @route   GET /api/incentives/stats
// @access  Private
const getIncentiveStats = async (req, res) => {
    try {
        const incentivePerCard = 200;
        const sellerId = new mongoose.Types.ObjectId(req.user._id);

        // Count approved sales for this seller
        const salesData = await Sale.aggregate([
            { $match: { sellerId, status: 'Approved' } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            }
        ]);

        const count = salesData.length > 0 ? salesData[0].count : 0;
        const totalEarnings = count * incentivePerCard;

        // Get credited incentives from Incentive model
        const creditedData = await Incentive.aggregate([
            { $match: { sellerId, status: 'Credited' } },
            {
                $group: {
                    _id: null,
                    credited: { $sum: '$amount' }
                }
            }
        ]);

        const credited = creditedData.length > 0 ? creditedData[0].credited : 0;
        const pending = totalEarnings - credited;

        res.json({
            totalEarnings,
            credited,
            pending: Math.max(pending, 0),
            count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed incentive ledger from approved sales
// @route   GET /api/incentives/ledger
// @access  Private
const getIncentiveLedger = async (req, res) => {
    try {
        const incentivePerCard = 200;

        // Get all approved sales for this seller
        const sales = await Sale.find({ sellerId: req.user._id, status: 'Approved' })
            .populate('leadId', 'name phoneNumber')
            .sort({ date: -1 });

        // Get all incentive records to check credited status
        const incentiveRecords = await Incentive.find({ sellerId: req.user._id });
        const incentiveMap = {};
        incentiveRecords.forEach(inc => {
            if (inc.saleId) {
                incentiveMap[inc.saleId.toString()] = inc.status;
            }
        });

        // Map each sale to a ledger entry
        const formattedLedger = sales.map(sale => ({
            id: sale._id,
            name: sale.leadId?.name || 'Unknown Client',
            product: sale.cardType || 'SBI Card',
            date: new Date(sale.date).toISOString().split('T')[0],
            amount: `₹${incentivePerCard.toLocaleString()}`,
            status: incentiveMap[sale._id.toString()] || 'Pending'
        }));

        res.json(formattedLedger);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get monthly performance stats for charts (from sales)
// @route   GET /api/incentives/monthly
// @access  Private
const getMonthlyIncentiveStats = async (req, res) => {
    try {
        const incentivePerCard = 200;

        const monthly = await Sale.aggregate([
            { $match: { sellerId: new mongoose.Types.ObjectId(req.user._id), status: 'Approved' } },
            {
                $group: {
                    _id: { $month: "$date" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Map month numbers to names
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedMonthly = monthly.map(item => ({
            name: monthNames[item._id - 1],
            amount: item.count * incentivePerCard
        }));

        res.json(formattedMonthly);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get aggregate incentive summary for all sellers (Admin Only)
// @route   GET /api/incentives/admin/summary
// @access  Private/Admin
const getAdminIncentiveSummary = async (req, res) => {
    try {
        const incentivePerCard = 200;

        const summary = await Sale.aggregate([
            { $match: { status: 'Approved' } },
            {
                $group: {
                    _id: '$sellerId',
                    cardsSold: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            { $unwind: '$sellerInfo' },
            {
                $project: {
                    _id: 1,
                    name: '$sellerInfo.name',
                    cardsSold: 1,
                    incentive: { $multiply: ['$cardsSold', incentivePerCard] }
                }
            },
            { $sort: { cardsSold: -1 } }
        ]);

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get incentive summary for Dashboard (both admin & seller)
// @route   GET /api/incentives/dashboard-summary
// @access  Private
const getDashboardIncentives = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const incentivePerCard = 200;
        const dailyTarget = 10;

        // Build match filter for all-time
        const saleMatch = { status: 'Approved' };
        if (!isAdmin) {
            saleMatch.sellerId = new mongoose.Types.ObjectId(req.user._id);
        }

        // 1. Aggregate All-Time sales data per seller
        const salesData = await Sale.aggregate([
            { $match: saleMatch },
            {
                $group: {
                    _id: '$sellerId',
                    cardsSold: { $sum: 1 },
                    totalSalesAmount: { $sum: '$amount' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            { $unwind: '$sellerInfo' },
            { $sort: { cardsSold: -1 } }
        ]);

        // 2. Aggregate Today's sales data per seller
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const dailyMatch = { 
            status: 'Approved',
            date: { $gte: startOfDay, $lte: endOfDay }
        };
        if (!isAdmin) {
            dailyMatch.sellerId = new mongoose.Types.ObjectId(req.user._id);
        }

        const dailyData = await Sale.aggregate([
            { $match: dailyMatch },
            {
                $group: {
                    _id: '$sellerId',
                    todayCount: { $sum: 1 }
                }
            }
        ]);

        const dailyMap = {};
        dailyData.forEach(d => {
            dailyMap[d._id.toString()] = d.todayCount;
        });

        // 3. Get pending incentives per seller from the Incentive model
        const pendingMatch = { status: 'Pending' };
        if (!isAdmin) {
            pendingMatch.sellerId = new mongoose.Types.ObjectId(req.user._id);
        }
        const pendingData = await Incentive.aggregate([
            { $match: pendingMatch },
            {
                $group: {
                    _id: '$sellerId',
                    pendingAmount: { $sum: '$amount' },
                    pendingCount: { $sum: 1 }
                }
            }
        ]);

        const pendingMap = {};
        pendingData.forEach(p => {
            pendingMap[p._id.toString()] = p;
        });

        // 4. Build final response
        const result = salesData.map(seller => {
            const sellerId = seller._id.toString();
            const pending = pendingMap[sellerId] || { pendingAmount: 0, pendingCount: 0 };
            const todayCount = dailyMap[sellerId] || 0;
            const totalIncentive = seller.cardsSold * incentivePerCard;

            return {
                _id: seller._id,
                sellerName: seller.sellerInfo.name,
                cardsSold: seller.cardsSold,
                incentivePerCard: incentivePerCard,
                totalIncentive: totalIncentive,
                pendingIncentive: pending.pendingAmount,
                pendingCount: pending.pendingCount,
                dailyCount: todayCount,
                dailyTarget: dailyTarget
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getIncentiveStats,
    getIncentiveLedger,
    getMonthlyIncentiveStats,
    getAdminIncentiveSummary,
    getDashboardIncentives
};
