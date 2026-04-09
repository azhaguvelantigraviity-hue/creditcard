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
        const settings = await OfficeSettings.findOne();
        const dailyTarget = settings?.dailyTarget || 10;
        const incentivePerCard = 200;
        const sellerId = new mongoose.Types.ObjectId(req.user._id);

        // Group sales by day and count approved ones
        const salesByDay = await Sale.aggregate([
            { $match: { sellerId, status: 'Approved' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        let totalEarnings = 0;
        let totalCount = 0;
        let todayCount = 0;
        const todayDate = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
        const todayObj = new Date(todayDate);
        const yyyy = todayObj.getFullYear();
        const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
        const dd = String(todayObj.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        salesByDay.forEach(day => {
            totalCount += day.count;
            if (day._id === todayStr) {
                todayCount = day.count;
            }
            if (day.count > dailyTarget) {
                totalEarnings += (day.count - dailyTarget) * incentivePerCard;
            }
        });

        // Get credited incentives from Incentive model (direct records)
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
            count: totalCount,
            todayCount
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
        const settings = await OfficeSettings.findOne();
        const dailyTarget = settings?.dailyTarget || 10;
        const incentivePerCard = 200;
        const sellerId = new mongoose.Types.ObjectId(req.user._id);

        // This is more complex because we need to group by day first, then by month
        const dailyTotals = await Sale.aggregate([
            { $match: { sellerId, status: 'Approved' } },
            {
                $group: {
                    _id: { 
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } },
                        month: { $month: { date: "$date", timezone: "Asia/Kolkata" } }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const monthlyMap = {};
        dailyTotals.forEach(day => {
            const m = day._id.month;
            if (!monthlyMap[m]) monthlyMap[m] = 0;
            if (day.count > dailyTarget) {
                monthlyMap[m] += (day.count - dailyTarget) * incentivePerCard;
            }
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedMonthly = Object.keys(monthlyMap).map(m => ({
            name: monthNames[parseInt(m) - 1],
            amount: monthlyMap[m]
        })).sort((a,b) => monthNames.indexOf(a.name) - monthNames.indexOf(b.name));

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
        const settings = await OfficeSettings.findOne();
        const dailyTargetValue = settings?.dailyTarget || 10;
        const incentivePerCard = 200;

        // Build match filter
        const saleMatch = { status: 'Approved' };
        if (!isAdmin) {
            saleMatch.sellerId = new mongoose.Types.ObjectId(req.user._id);
        }

        // 1. Get All Sales grouped by Seller and Date to calculate total net incentive
        const salesBySellerAndDay = await Sale.aggregate([
            { $match: saleMatch },
            {
                $group: {
                    _id: { 
                        sellerId: '$sellerId', 
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } } 
                    },
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            },
            {
                $group: {
                    _id: '$_id.sellerId',
                    cardsSold: { $sum: '$count' },
                    totalSalesAmount: { $sum: '$amount' },
                    dailyBreakdown: {
                        $push: {
                            date: '$_id.date',
                            count: '$count'
                        }
                    }
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
            { $unwind: '$sellerInfo' }
        ]);

        // 2. Today's sales count
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
            { $group: { _id: '$sellerId', todayCount: { $sum: 1 } } }
        ]);

        const dailyMap = {};
        dailyData.forEach(d => {
            dailyMap[d._id.toString()] = d.todayCount;
        });

        // 3. Pending records
        const pendingMatch = { status: 'Pending' };
        if (!isAdmin) {
            pendingMatch.sellerId = new mongoose.Types.ObjectId(req.user._id);
        }
        const pendingData = await Incentive.aggregate([
            { $match: pendingMatch },
            { $group: { _id: '$sellerId', pendingAmount: { $sum: '$amount' }, pendingCount: { $sum: 1 } } }
        ]);

        const pendingMap = {};
        pendingData.forEach(p => {
            pendingMap[p._id.toString()] = p;
        });

        // 4. Build final response with threshold logic
        const result = salesBySellerAndDay.map(seller => {
            const sellerId = seller._id.toString();
            const pending = pendingMap[sellerId] || { pendingAmount: 0, pendingCount: 0 };
            const todayCount = dailyMap[sellerId] || 0;

            // Calculate total incentive based on daily threshold
            let totalIncentive = 0;
            seller.dailyBreakdown.forEach(day => {
                if (day.count > dailyTargetValue) {
                    totalIncentive += (day.count - dailyTargetValue) * incentivePerCard;
                }
            });

            return {
                _id: seller._id,
                sellerName: seller.sellerInfo.name,
                cardsSold: seller.cardsSold,
                incentivePerCard: incentivePerCard,
                totalIncentive: totalIncentive,
                pendingIncentive: pending.pendingAmount,
                pendingCount: pending.pendingCount,
                dailyCount: todayCount,
                dailyTarget: dailyTargetValue
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
