const Sale = require('../models/Sale');
const Incentive = require('../models/Incentive');
const OfficeSettings = require('../models/OfficeSettings');

// @desc    Track a new successful sale
// @route   POST /api/sales
// @access  Private (Sellers and Admins)
const createSale = async (req, res) => {
    const { leadId, applicationId, cardType, amount, status, date } = req.body;

    try {
        const sale = await Sale.create({
            sellerId: req.user._id,
            leadId,
            applicationId,
            cardType,
            amount,
            status,
            date
        });

        res.status(201).json(sale);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all sales (Admin: all, Seller: own)
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
    try {
        let sales;
        if (req.user.role === 'admin') {
            sales = await Sale.find({}).populate('sellerId', 'name email').populate('leadId', 'name phoneNumber');
        } else {
            sales = await Sale.find({ sellerId: req.user._id }).populate('leadId', 'name phoneNumber');
        }
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update sale status (Approval)
// @route   PUT /api/sales/:id
// @access  Private (Admin only)
const updateSaleStatus = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);

        if (sale) {
            sale.status = req.body.status || sale.status;
            const updatedSale = await sale.save();

            // Create incentive record for every approved sale (₹200 per card)
            if (updatedSale.status === 'Approved') {
                const incentivePerCard = 200;

                await Incentive.findOneAndUpdate(
                    { saleId: updatedSale._id },
                    { 
                        sellerId: updatedSale.sellerId,
                        amount: incentivePerCard, 
                        status: 'Credited', 
                        payoutDate: new Date() 
                    },
                    { upsert: true, new: true }
                );
            } else {
                // If sale is no longer approved, remove incentive
                await Incentive.findOneAndDelete({ saleId: updatedSale._id });
            }

            res.json(updatedSale);
        } else {
            res.status(404).json({ message: 'Sale record not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get sales stats for dashboard
// @route   GET /api/sales/stats
// @access  Private
const getSalesStats = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const matchBase = isAdmin ? { status: 'Approved' } : { sellerId: req.user._id, status: 'Approved' };

        // 1. Core KPIs
        const salesData = await Sale.aggregate([
            { $match: matchBase },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);
        const totalRevenue = salesData.length > 0 ? salesData[0].totalRevenue : 0;
        const totalIssuedCards = salesData.length > 0 ? salesData[0].count : 0;

        // 2. Top Performer
        const performers = await Sale.aggregate([
            { $match: { status: 'Approved' } },
            { $group: { 
                _id: '$sellerId', 
                revenue: { $sum: '$amount' }, 
                sales: { $sum: 1 } 
            }},
            { $sort: { revenue: -1 } },
            { $limit: 1 },
            { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'seller'
            }},
            { $unwind: '$seller' }
        ]);
        
        // Format to Lakhs logic securely
        const formatMoney = (val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val.toLocaleString()}`;
        
        let topPerformer = null;
        if (performers.length > 0) {
            topPerformer = {
                id: performers[0]._id,
                name: performers[0].seller.name,
                sales: performers[0].sales,
                revenue: formatMoney(performers[0].revenue),
                avatar: performers[0].seller.name.substring(0, 2).toUpperCase()
            };
        } else {
            topPerformer = { id: 0, name: 'No Sales Yet', sales: 0, revenue: '₹0', avatar: '--' };
        }

        // 3. Revenue Growth Data (Monthly)
        const currentYear = new Date().getFullYear();
        const monthlyAggregation = await Sale.aggregate([
            { $match: { 
                ...matchBase, 
                date: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) } 
            }},
            { $group: {
                _id: { $month: '$date' },
                revenue: { $sum: '$amount' },
                sales: { $sum: 1 }
            }},
            { $sort: { '_id': 1 } }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let monthlyStats = months.map((m) => ({ name: m, revenue: 0, sales: 0 }));
        monthlyAggregation.forEach(data => {
            if (data._id >= 1 && data._id <= 12) {
                monthlyStats[data._id - 1].revenue = data.revenue;
                monthlyStats[data._id - 1].sales = data.sales;
            }
        });
        
        const currentMonthIndex = new Date().getMonth();
        monthlyStats = monthlyStats.slice(0, currentMonthIndex + 2); // Show up to slightly ahead

        // 4. Popular Card Types
        const cardTypes = await Sale.aggregate([
            { $match: matchBase },
            { $group: {
                _id: '$cardType',
                value: { $sum: 1 }
            }},
            { $sort: { value: -1 } }
        ]);
        
        const colors = ['#2c3e8c', '#00a1e1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        let typeStats = cardTypes.map((c, idx) => ({
            name: c._id,
            value: c.value,
            color: colors[idx % colors.length]
        }));
        
        if (typeStats.length === 0) {
            typeStats = [
                { name: 'SBI Elite', value: 0, color: '#2c3e8c' },
                { name: 'SBI Prime', value: 0, color: '#00a1e1' }
            ];
        }

        // 5. Recent Successful Sales
        const recentSales = await Sale.find(matchBase)
            .sort({ date: -1 })
            .limit(5)
            .populate('sellerId', 'name')
            .populate('leadId', 'name');

        const formattedRecentSales = recentSales.map(s => ({
            id: s.applicationId,
            name: s.leadId ? s.leadId.name : 'Unknown',
            card: s.cardType,
            seller: s.sellerId ? s.sellerId.name : 'Unknown',
            date: new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
        }));

        res.json({
            totalRevenue,
            totalIssuedCards,
            topPerformer,
            monthlyStats,
            typeStats,
            recentSales: formattedRecentSales
        });
    } catch (error) {
        console.error('Sales Stats Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSale,
    getSales,
    updateSaleStatus,
    getSalesStats
};
