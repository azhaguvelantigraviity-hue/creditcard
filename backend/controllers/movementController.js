const MovementLog = require('../models/MovementLog');
const Attendance = require('../models/Attendance');

// @desc    Log exit from office geo-fence
// @route   POST /api/attendance/movement/exit
// @access  Private
const logExit = async (req, res) => {
    try {
        const { reason, lat, lng } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const attendance = await Attendance.findOne({ userId: req.user._id, date: today, isActive: true });
        if (!attendance) {
            return res.status(404).json({ message: 'No active session found.' });
        }

        // Close any previously open log
        const existingOpen = await MovementLog.findOne({ attendanceId: attendance._id, reEntryTime: null });
        if (existingOpen) {
            return res.status(400).json({ message: 'You already have an open exit log.' });
        }

        const log = await MovementLog.create({
            userId: req.user._id,
            attendanceId: attendance._id,
            exitTime: new Date(),
            reason,
            exitLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined,
            deducted: reason === 'Personal'
        });

        res.status(201).json({ message: 'Exit logged', log });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Log re-entry into office geo-fence
// @route   POST /api/attendance/movement/reentry
// @access  Private
const logReEntry = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ userId: req.user._id, date: today, isActive: true });

        if (!attendance) {
            return res.status(404).json({ message: 'No active session found.' });
        }

        const openLog = await MovementLog.findOne({ attendanceId: attendance._id, reEntryTime: null });
        if (!openLog) {
            return res.status(404).json({ message: 'No open exit log found.' });
        }

        const reEntryTime = new Date();
        const durationMinutes = Math.floor((reEntryTime - openLog.exitTime) / 60000);

        openLog.reEntryTime = reEntryTime;
        openLog.durationMinutes = durationMinutes;
        if (openLog.reason === 'Personal') openLog.deducted = true;
        await openLog.save();

        res.json({ message: 'Re-entry logged', log: openLog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get movement logs for today's session
// @route   GET /api/attendance/movement
// @access  Private
const getMovementLogs = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ userId: req.user._id, date: today });

        if (!attendance) {
            return res.json([]);
        }

        const logs = await MovementLog.find({ attendanceId: attendance._id }).sort({ exitTime: 1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { logExit, logReEntry, getMovementLogs };
