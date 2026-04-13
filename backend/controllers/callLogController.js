const CallLog = require('../models/CallLog');
const Lead = require('../models/Lead');
const User = require('../models/User');

// @desc    Create a new call log
// @route   POST /api/calls
// @access  Private
const createCallLog = async (req, res) => {
    const { leadId, outcome, duration, notes, sellerId } = req.body;

    try {
        const callLog = await CallLog.create({
            leadId,
            outcome,
            duration,
            notes,
            sellerId: sellerId || req.user._id
        });

        // Update lead status based on call outcome if needed
        if (outcome === 'Interested') {
            await Lead.findByIdAndUpdate(leadId, { status: 'Follow Up' });
        }

        res.status(201).json(callLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all call logs
// @route   GET /api/calls
// @access  Private
const getCallLogs = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'tl') {
            const teamUsers = await User.find({ teamLeaderId: req.user._id }).select('_id');
            const teamIds = teamUsers.map(u => u._id);
            teamIds.push(req.user._id);
            query.sellerId = { $in: teamIds };
        } else if (req.user.role !== 'admin') {
            query.sellerId = req.user._id;
        }

        const callLogs = await CallLog.find(query)
            .populate('leadId', 'name phoneNumber')
            .populate('sellerId', 'name')
            .sort('-createdAt');

        res.json(callLogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get call statistics
// @route   GET /api/calls/stats
// @access  Private
const getCallStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let query = { createdAt: { $gte: today } };
        if (req.user.role === 'tl') {
            const teamUsers = await User.find({ teamLeaderId: req.user._id }).select('_id');
            const teamIds = teamUsers.map(u => u._id);
            teamIds.push(req.user._id);
            query.sellerId = { $in: teamIds };
        } else if (req.user.role !== 'admin') {
            query.sellerId = req.user._id;
        }

        const logs = await CallLog.find(query);
        
        const totalCalls = logs.length;
        const missedCalls = logs.filter(l => ['No Answer', 'Busy'].includes(l.outcome)).length;
        const answeredCalls = totalCalls - missedCalls;

        let totalSecs = 0;
        let countWithDuration = 0;
        logs.forEach(l => {
            if (l.duration) {
                let m = 0; let s = 0;
                let minMatch = l.duration.match(/(\d+)m/);
                let secMatch = l.duration.match(/(\d+)s/);
                let fallbackMatch = l.duration.match(/^\s*(\d+)\s*$/); // Pure numbers assumed seconds

                if (minMatch) m = parseInt(minMatch[1]);
                if (secMatch) s = parseInt(secMatch[1]);
                if (fallbackMatch) s = parseInt(fallbackMatch[1]);

                totalSecs += (m * 60) + s;
                countWithDuration++;
            }
        });

        let avgSecs = countWithDuration > 0 ? totalSecs / countWithDuration : 0;
        let avgMins = Math.floor(avgSecs / 60);
        let remainSecs = Math.floor(avgSecs % 60);

        res.json({
            totalCalls,
            answeredCalls,
            missedCalls,
            avgDuration: countWithDuration > 0 ? `${avgMins}m ${remainSecs}s` : '0m 0s'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createCallLog,
    getCallLogs,
    getCallStats
};
