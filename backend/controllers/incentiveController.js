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

        const bronzeStart = settings?.tierBronzeStart || 11;
        const silverStart = settings?.tierSilverStart || 16;
        const goldStart = settings?.tierGoldStart || 21;
        
        const bronzePayout = settings?.tierBronzePayout || 200;
        const silverPayout = settings?.tierSilverPayout || 225;
        const goldPayout = settings?.tierGoldPayout || 250;

        salesByDay.forEach(day => {
            totalCount += day.count;
            if (day._id === todayStr) {
                todayCount = day.count;
            }
            
            for (let i = 1; i <= day.count; i++) {
                if (i >= goldStart) {
                    totalEarnings += goldPayout;
                } else if (i >= silverStart) {
                    totalEarnings += silverPayout;
                } else if (i >= bronzeStart) {
                    totalEarnings += bronzePayout;
                }
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
        
        let todayEarnings = 0;
        const todayExtra = todayCount > dailyTarget ? todayCount - dailyTarget : 0;
        
        for (let i = 1; i <= todayCount; i++) {
            if (i >= goldStart) {
                todayEarnings += goldPayout;
            } else if (i >= silverStart) {
                todayEarnings += silverPayout;
            } else if (i >= bronzeStart) {
                todayEarnings += bronzePayout;
            }
        }
        
        let currentTier = 'Unranked';
        if (todayCount >= goldStart) currentTier = 'Gold';
        else if (todayCount >= silverStart) currentTier = 'Silver';
        else if (todayCount >= bronzeStart) currentTier = 'Bronze';

        res.json({
            totalEarnings,
            credited,
            pending: Math.max(pending, 0),
            count: totalCount,
            todayCount,
            dailyTarget,
            todayExtra,
            todayEarnings,
            currentTier
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
        const settings = await OfficeSettings.findOne();
        const dailyTarget = settings?.dailyTarget || 10;
        const incentivePerCard = 200;

        // Get all approved sales for this seller
        const sales = await Sale.find({ sellerId: req.user._id, status: 'Approved' })
            .populate('leadId', 'name phoneNumber');

        // Get all incentive records to check credited status
        const incentiveRecords = await Incentive.find({ sellerId: req.user._id });
        const incentiveMap = {};
        incentiveRecords.forEach(inc => {
            if (inc.saleId) {
                incentiveMap[inc.saleId.toString()] = { status: inc.status, amount: inc.amount };
            }
        });

        // Sort oldest first to calculate daily targets accurately
        const sortedSales = [...sales].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const formattedLedger = [];
        const dailyCountMap = {};

        sortedSales.forEach(sale => {
            // Group by local date string
            const localDate = new Date(sale.date).toLocaleDateString("en-CA", {timeZone: "Asia/Kolkata"});
            
            if (!dailyCountMap[localDate]) {
                dailyCountMap[localDate] = 0;
            }
            dailyCountMap[localDate]++;

            let amount = 0;
            const incRecord = incentiveMap[sale._id.toString()];
            
            // Prefer actual DB amount if available (covers manual overrides or correct saves)
            if (incRecord !== undefined && incRecord.amount !== undefined) {
                amount = incRecord.amount;
            } else {
                // Dynamic fallback calculation for legacy records with Advanced Tiers
                const count = dailyCountMap[localDate];
                
                const bronzeStart = settings?.tierBronzeStart || 11;
                const silverStart = settings?.tierSilverStart || 16;
                const goldStart = settings?.tierGoldStart || 21;

                if (count >= goldStart) {
                    amount = settings?.tierGoldPayout || 250;
                } else if (count >= silverStart) {
                    amount = settings?.tierSilverPayout || 225;
                } else if (count >= bronzeStart) {
                    amount = settings?.tierBronzePayout || 200;
                } else {
                    amount = 0;
                }
            }

            const status = incRecord?.status || (amount === 0 ? 'Credited' : 'Pending');

            formattedLedger.push({
                id: sale._id,
                name: sale.leadId?.name || 'Unknown Client',
                product: sale.cardType || 'SBI Card',
                date: localDate,
                amount: `₹${amount.toLocaleString()}`,
                status: status
            });
        });

        // Reverse to show newest sales at the top of the UI
        formattedLedger.reverse();

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
        const isTL = req.user.role === 'tl';
        const settings = await OfficeSettings.findOne();
        const dailyTargetValue = settings?.dailyTarget || 10;
        const incentivePerCard = 200;

        // Build user filter
        const userMatch = { role: { $in: ['seller', 'tl'] } };
        
        if (isTL) {
            // Team leader sees their team members (by ID match) and themselves
            const userId = new mongoose.Types.ObjectId(req.user._id);
            userMatch.$or = [{ teamLeaderId: userId }, { _id: userId }];
        } else if (!isAdmin) {
            userMatch._id = new mongoose.Types.ObjectId(req.user._id);
        }

        // 1. Get ALL Sellers
        const allSellers = await User.find(userMatch, 'name');

        // 2. Get today's range in Asia/Kolkata
        // 2. Get today's range in Asia/Kolkata correctly
        const now = new Date();
        const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
        const startOfDay = new Date(`${istDateStr}T00:00:00.000+05:30`);
        const endOfDay = new Date(`${istDateStr}T23:59:59.999+05:30`);

        // 3. Aggregate all relevant data in one pass if possible, or build a map
        const sellerData = await Promise.all(allSellers.map(async (seller) => {
            const sellerId = seller._id;

            // Approved Sales for this seller
            const approvedSalesData = await Sale.aggregate([
                { $match: { sellerId, status: 'Approved' } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Today's specific count
            const todaySaleCount = await Sale.countDocuments({
                sellerId,
                status: 'Approved',
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            // Pending Incentive Amount
            const pendingIncentiveData = await Incentive.aggregate([
                { $match: { sellerId, status: 'Pending' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]);

            const pendingAmt = pendingIncentiveData[0]?.total || 0;
            const pendingCount = pendingIncentiveData[0]?.count || 0;

            // Calculate tiered incentive from sales history
            let totalIncentive = 0;
            const bronzeStart = settings?.tierBronzeStart || 11;
            const silverStart = settings?.tierSilverStart || 16;
            const goldStart = settings?.tierGoldStart || 21;
            
            const bronzePayout = settings?.tierBronzePayout || 200;
            const silverPayout = settings?.tierSilverPayout || 225;
            const goldPayout = settings?.tierGoldPayout || 250;

            let totalApprovedCards = 0;
            approvedSalesData.forEach(day => {
                totalApprovedCards += day.count;
                for (let i = 1; i <= day.count; i++) {
                    if (i >= goldStart) totalIncentive += goldPayout;
                    else if (i >= silverStart) totalIncentive += silverPayout;
                    else if (i >= bronzeStart) totalIncentive += bronzePayout;
                }
            });

            let currentTier = 'Unranked';
            if (todaySaleCount >= goldStart) currentTier = 'Gold';
            else if (todaySaleCount >= silverStart) currentTier = 'Silver';
            else if (todaySaleCount >= bronzeStart) currentTier = 'Bronze';

            return {
                _id: sellerId,
                sellerName: seller.name,
                cardsSold: totalApprovedCards,
                incentivePerCard: 200,
                totalIncentive: totalIncentive,
                pendingIncentive: pendingAmt,
                pendingCount: pendingCount,
                dailyCount: todaySaleCount,
                dailyTarget: dailyTargetValue,
                currentTier: currentTier
            };
        }));

        res.json(sellerData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get admin's personal incentive payout based on dynamic model
// @route   GET /api/incentives/admin-stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        const settings = await OfficeSettings.findOne();
        if (!settings) return res.status(404).json({ message: 'Settings not found' });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all approved sales today
        const salesData = await Sale.aggregate([
            { $match: { status: 'Approved', date: { $gte: startOfDay, $lte: endOfDay } } },
            { $group: { _id: '$sellerId', count: { $sum: 1 } } }
        ]);

        let adminEarnings = 0;
        let adminExtraSales = 0;
        let successfulSellers = 0;
        let totalCompanySales = 0;
        let totalSellerIncentives = 0;

        const dailyTargetValue = settings.dailyTarget || 10;
        const incentivePerCard = 200;

        salesData.forEach(seller => {
            totalCompanySales += seller.count;
            if (seller.count > dailyTargetValue) {
                successfulSellers++;
                totalSellerIncentives += (seller.count - dailyTargetValue) * incentivePerCard;
            }
        });

        if (settings.adminIncentiveModel === 'total_sales') {
            const target = settings.adminCompanyTarget || 150;
            if (totalCompanySales > target) {
                adminExtraSales = totalCompanySales - target;
                adminEarnings = adminExtraSales * (settings.adminIncentivePerExtraSale || 50);
            }
        } else if (settings.adminIncentiveModel === 'per_seller') {
            adminEarnings = successfulSellers * (settings.adminIncentivePerSeller || 100);
        } else if (settings.adminIncentiveModel === 'percentage') {
            const percentage = settings.adminIncentivePercentage || 5;
            adminEarnings = (totalSellerIncentives * percentage) / 100;
        }

        res.json({
            model: settings.adminIncentiveModel,
            adminEarnings,
            totalCompanySales,
            successfulSellers,
            totalSellerIncentives,
            adminExtraSales,
            details: {
                target: settings.adminIncentiveModel === 'total_sales' ? settings.adminCompanyTarget : 0,
                multiplier: settings.adminIncentiveModel === 'total_sales' ? settings.adminIncentivePerExtraSale :
                            settings.adminIncentiveModel === 'per_seller' ? settings.adminIncentivePerSeller :
                            settings.adminIncentivePercentage
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getIncentiveStats,
    getIncentiveLedger,
    getMonthlyIncentiveStats,
    getAdminIncentiveSummary,
    getDashboardIncentives,
    getAdminStats
};
