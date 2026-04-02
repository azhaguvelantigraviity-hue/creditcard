const User = require('../models/User');
const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const Attendance = require('../models/Attendance');
const CallLog = require('../models/CallLog');

const getDashboardStats = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const userId = req.user._id;

        // Base match object for queries based on role
        const matchBase = isAdmin ? {} : { sellerId: userId };
        const leadMatchBase = isAdmin ? {} : { assignedTo: userId };
        const userMatchBase = isAdmin ? {} : { userId: userId };

        // 1. Basic KPI Cards
        const totalSellers = isAdmin ? await User.countDocuments({ role: 'seller' }) : await Sale.countDocuments({ sellerId: userId });
        const totalLeads = await Lead.countDocuments(leadMatchBase);
        const activeLeads = await Lead.countDocuments({ ...leadMatchBase, status: { $ne: 'Converted' } });
        
        const salesAggregate = await Sale.aggregate([
            { $match: matchBase },
            { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);
        const totalSalesAmount = salesAggregate.length > 0 ? salesAggregate[0].totalAmount : 0;
        const totalSalesCount = salesAggregate.length > 0 ? salesAggregate[0].count : 0;
        const conversionRate = totalLeads > 0 ? ((totalSalesCount / totalLeads) * 100).toFixed(1) : 0;

        // 2. Chart Data (Last 7 Days)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = [];
        
        // Let's loop the last 7 days and count
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() - i);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
            
            const salesCount = await Sale.countDocuments({
                ...matchBase,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            const leadsCount = await Lead.countDocuments({
                ...leadMatchBase,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            chartData.push({
                name: days[targetDate.getDay()],
                sales: salesCount,
                leads: leadsCount
            });
        }

        // 3. Recent Activities Array (Fetch top n from each collection and merge)
        const fetchLimit = 5;
        
        // a. Latest Sales
        const latestSales = await Sale.find(matchBase)
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .populate(isAdmin ? 'sellerId' : '', 'name');
        
        // b. Latest Leads
        const latestLeads = await Lead.find(leadMatchBase)
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .populate(isAdmin ? 'assignedTo' : '', 'name');
            
        // c. Latest Calls
        const latestCalls = await CallLog.find(matchBase)
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .populate('leadId', 'name')
            .populate(isAdmin ? 'sellerId' : '', 'name');

        // d. Latest Attendance (Login/Logout)
        const latestAttendances = await Attendance.find(userMatchBase)
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .populate('userId', 'name');

        // Normalize activities into a standard object array
        let activities = [];
        latestSales.forEach(s => {
            activities.push({
                type: 'sale',
                name: isAdmin ? s.sellerId?.name || 'Seller' : 'You',
                action: `Closed Sale - ${s.cardType}`,
                time: s.createdAt,
                iconType: 'ShieldCheck'
            });
        });

        latestLeads.forEach(l => {
            activities.push({
                type: 'lead',
                name: isAdmin ? l.assignedTo?.name || 'Seller' : 'You',
                action: `Added Lead: ${l.name}`,
                time: l.createdAt,
                iconType: 'Target'
            });
        });

        latestCalls.forEach(c => {
            activities.push({
                type: 'call',
                name: isAdmin ? c.sellerId?.name || 'Seller' : 'You',
                action: `Call Logged: ${c.outcome} (${c.leadId?.name || 'Lead'})`,
                time: c.createdAt,
                iconType: 'PhoneCall'
            });
        });

        latestAttendances.forEach(a => {
            // Include only login for simplicity, or handle updates
            activities.push({
                type: 'attendance',
                name: a.userId?.name || 'User',
                action: `Marked Attendance (${a.status})`,
                time: a.createdAt, // Or a.loginTime
                iconType: 'Clock'
            });
        });

        // Sort combined activities descending by time, slice to Top 7
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        activities = activities.slice(0, 7);

        // Convert the Date to a Time Ago string
        const getTimeAgo = (dateStr) => {
            const date = new Date(dateStr);
            const now = new Date();
            const diffSec = Math.floor((now - date) / 1000);
            
            if (diffSec < 60) return `${diffSec || 1} secs ago`;
            if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
            if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
            return `${Math.floor(diffSec / 86400)} days ago`;
        };

        const recentActivities = activities.map(act => ({
            ...act,
            timeLabel: getTimeAgo(act.time)
        }));

        res.json({
            totalSellers,
            activeLeads,
            totalSalesAmount,
            conversionRate,
            chartData,
            recentActivities,
            trend: {
                sellers: isAdmin ? 12 : 8,
                leads: isAdmin ? -5 : -2,
                sales: isAdmin ? 18 : 24,
                conversion: isAdmin ? 2 : 5
            }
        });

    } catch (error) {
        console.error('Stats controller error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats
};
