const CallLog = require('../models/CallLog');
const Lead = require('../models/Lead');

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
        if (req.user.role !== 'admin') {
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
        if (req.user.role !== 'admin') {
            query.sellerId = req.user._id;
        }

        const logs = await CallLog.find(query);
        
        const totalCalls = logs.length;
        const interestedCalls = logs.filter(l => l.outcome === 'Interested').length;
        const successRate = totalCalls > 0 ? ((interestedCalls / totalCalls) * 100).toFixed(0) : 0;

        res.json({
            totalCalls,
            successRate: `${successRate}%`,
            avgDuration: '3m 15s', // Placeholder as duration is string
            missedTasks: 0 // Placeholder
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
