const User = require('../models/User');
const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const Attendance = require('../models/Attendance');
const CallLog = require('../models/CallLog');
const Task = require('../models/Task');

const getDashboardStats = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const isTL = req.user.role === 'tl';
        const userId = req.user._id;

        let matchBase = {};
        let leadMatchBase = {};
        let userMatchBase = {};
        let filterSellers = [];

        if (isTL) {
            const teamUsers = await User.find({ teamLeaderId: userId }).select('_id');
            filterSellers = teamUsers.map(u => u._id);
            filterSellers.push(userId); // Include TL's personal stats as well implicitly
            
            matchBase = { sellerId: { $in: filterSellers } };
            leadMatchBase = { assignedTo: { $in: filterSellers } };
            userMatchBase = { userId: { $in: filterSellers } };
        } else if (!isAdmin) {
            matchBase = { sellerId: userId };
            leadMatchBase = { assignedTo: userId };
            userMatchBase = { userId: userId };
        }

        // 1. Basic KPI Cards
        const totalSellers = isAdmin ? await User.countDocuments({ role: 'seller' }) : (isTL ? filterSellers.length : await Sale.countDocuments({ sellerId: userId }));
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

        // 4. TL/Admin Specific: Team Performance Today (Calls & Tasks)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Task Stats
        const tasks = await Task.find({
            assignedTo: { $in: filterSellers.length > 0 ? filterSellers : [userId] }
        });
        const taskStats = {
            pending: tasks.filter(t => t.status === 'Pending').length,
            inProgress: tasks.filter(t => t.status === 'In Progress').length,
            completedToday: tasks.filter(t => t.status === 'Completed' && t.updatedAt >= startOfDay).length
        };

        // Call Stats
        const calls = await CallLog.find({
            sellerId: { $in: filterSellers.length > 0 ? filterSellers : [userId] },
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });
        
        const totalCalls = calls.length;
        const missedCalls = calls.filter(c => ['No Answer', 'Busy'].includes(c.outcome)).length;
        const answeredCalls = totalCalls - missedCalls;
        
        // Duration Calculation
        let totalSecs = 0;
        let validDurations = 0;
        calls.forEach(c => {
            if (c.duration) {
                const minMatch = c.duration.match(/(\d+)m/);
                const secMatch = c.duration.match(/(\d+)s/);
                const m = minMatch ? parseInt(minMatch[1]) : 0;
                const s = secMatch ? parseInt(secMatch[1]) : 0;
                if (m || s) {
                    totalSecs += (m * 60) + s;
                    validDurations++;
                }
            }
        });
        const avgSecs = validDurations > 0 ? totalSecs / validDurations : 0;
        const avgDuration = `${Math.floor(avgSecs / 60)}m ${Math.floor(avgSecs % 60)}s`;

        const callStats = { totalCalls, answeredCalls, missedCalls, avgDuration };

        // 5. Employee performance (List of sellers with counts)
        let teamPerformance = [];
        if (isAdmin || isTL) {
            const sellersForPerf = await User.find(isTL ? { teamLeaderId: userId } : { role: 'seller' }).select('name status');
            const activeAttendances = await Attendance.find({ isActive: true }).select('userId');
            const activeUserIds = activeAttendances.map(a => a.userId.toString());

            for (const seller of sellersForPerf) {
                const sCalls = calls.filter(c => c.sellerId.toString() === seller._id.toString()).length;
                const sSales = await Sale.countDocuments({ sellerId: seller._id, createdAt: { $gte: startOfDay, $lte: endOfDay } });
                const sTasks = tasks.filter(t => t.assignedTo.toString() === seller._id.toString() && t.status === 'Completed' && t.updatedAt >= startOfDay).length;
                const isOnline = activeUserIds.includes(seller._id.toString());
                
                teamPerformance.push({
                    name: seller.name,
                    calls: sCalls,
                    sales: sSales,
                    tasks: sTasks,
                    status: isOnline ? 'Online' : 'Offline' 
                });
            }
        }

        res.json({
            totalSellers,
            activeLeads,
            totalSalesAmount,
            conversionRate,
            chartData,
            recentActivities,
            taskStats,
            callStats,
            teamPerformance,
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
