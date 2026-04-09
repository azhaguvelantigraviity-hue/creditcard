const Attendance = require('../models/Attendance');
const MovementLog = require('../models/MovementLog');
const OfficeSettings = require('../models/OfficeSettings');
const { haversineDistance } = require('../utils/haversine');

// Helper: get or create default office settings
const getSettings = async () => {
    let settings = await OfficeSettings.findOne();
    if (!settings) {
        settings = await OfficeSettings.create({});
    }
    return settings;
};

// Helper: determine status from login time string
const determineStatus = (loginDate, settings) => {
    const hours = loginDate.getHours();
    const minutes = loginDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const [lateH, lateM] = settings.lateThreshold.split(':').map(Number);
    const [halfH, halfM] = settings.halfDayThreshold.split(':').map(Number);
    const lateLimit = lateH * 60 + lateM;
    const halfLimit = halfH * 60 + halfM;

    if (totalMinutes <= lateLimit) return 'On Time';
    if (totalMinutes < halfLimit) return 'Late';
    return 'Half Day';
};

// @desc    Staff Login (with geo-fence check for office mode)
// @route   POST /api/attendance/login
// @access  Private
const loginAttendance = async (req, res) => {
    try {
        const { mode, lat, lng } = req.body;
        const settings = await getSettings();
        const today = new Date().toISOString().split('T')[0];

        // Check if already logged in today
        const existing = await Attendance.findOne({ userId: req.user._id, date: today });
        if (existing && existing.isActive) {
            return res.status(400).json({ message: 'You are already logged in for today.' });
        }
        if (existing && !existing.isActive) {
            return res.status(400).json({ message: 'You have already logged out for today.' });
        }

        // Geo-fence check for office mode
        if (mode === 'office') {
            if (!lat || !lng) {
                return res.status(400).json({ message: 'Location is required for office mode.' });
            }
            const distance = haversineDistance(
                parseFloat(lat), parseFloat(lng),
                settings.officeLat, settings.officeLng
            );
            if (distance > settings.geofenceRadius) {
                return res.status(403).json({
                    message: `You are not in office location. You are ${Math.round(distance)}m away (allowed: ${settings.geofenceRadius}m).`,
                    distance: Math.round(distance)
                });
            }
        }

        const loginTime = new Date();
        const status = determineStatus(loginTime, settings);

        const attendance = await Attendance.create({
            userId: req.user._id,
            date: today,
            loginTime,
            mode,
            status,
            isActive: true,
            loginLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined
        });

        res.status(201).json({ message: 'Login successful', attendance, status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Staff Logout
// @route   POST /api/attendance/logout
// @access  Private
const logoutAttendance = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ userId: req.user._id, date: today, isActive: true });

        if (!attendance) {
            return res.status(404).json({ message: 'No active attendance session found for today.' });
        }

        const { logoutReason } = req.body;
        const logoutTime = new Date();
        const workingMs = logoutTime - attendance.loginTime;
        const workingMinutes = Math.floor(workingMs / 60000);

        // Close any open movement logs
        const openLog = await MovementLog.findOne({ attendanceId: attendance._id, reEntryTime: null });
        if (openLog) {
            openLog.reEntryTime = logoutTime;
            openLog.durationMinutes = Math.floor((logoutTime - openLog.exitTime) / 60000);
            if (openLog.reason === 'Personal') openLog.deducted = true;
            await openLog.save();
        }

        // Calculate total outside (personal) minutes
        const personalLogs = await MovementLog.find({ attendanceId: attendance._id, reason: 'Personal', deducted: true });
        const totalOutsideMinutes = personalLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

        attendance.logoutTime = logoutTime;
        attendance.logoutReason = logoutReason;
        attendance.isActive = false;
        attendance.totalWorkingMinutes = Math.max(0, workingMinutes - totalOutsideMinutes);
        attendance.totalOutsideMinutes = totalOutsideMinutes;
        await attendance.save();

        res.json({ message: 'Logout successful', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get today's attendance status for current user
// @route   GET /api/attendance/today
// @access  Private
const getTodayStatus = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ userId: req.user._id, date: today });

        if (!attendance) {
            return res.json({ status: 'not_logged_in', attendance: null });
        }

        // Get open movement log if any
        const openMovement = await MovementLog.findOne({ attendanceId: attendance._id, reEntryTime: null });

        res.json({ attendance, openMovement: openMovement || null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify geo-fence (called periodically from client)
// @route   POST /api/attendance/geofence-check
// @access  Private
const geofenceCheck = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const settings = await getSettings();

        const distance = haversineDistance(
            parseFloat(lat), parseFloat(lng),
            settings.officeLat, settings.officeLng
        );

        const isInsideOffice = distance <= settings.geofenceRadius;
        res.json({ isInsideOffice, distance: Math.round(distance), radius: settings.geofenceRadius });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: get all attendance with filters
// @route   GET /api/attendance/admin?date=&period=daily|weekly|monthly
// @access  Private (Admin)
const getAdminReport = async (req, res) => {
    try {
        const { date, period } = req.query;
        let dateFilter = {};

        const today = new Date().toISOString().split('T')[0];
        const targetDate = date || today;

        if (period === 'weekly') {
            const start = new Date(targetDate);
            start.setDate(start.getDate() - start.getDay());
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            dateFilter = {
                date: {
                    $gte: start.toISOString().split('T')[0],
                    $lte: end.toISOString().split('T')[0]
                }
            };
        } else if (period === 'monthly') {
            const d = new Date(targetDate);
            const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
            const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const monthEnd = new Date(nextMonth - 1).toISOString().split('T')[0];
            dateFilter = { date: { $gte: monthStart, $lte: monthEnd } };
        } else {
            dateFilter = { date: targetDate };
        }

        const records = await Attendance.find(dateFilter)
            .populate('userId', 'name email role phoneNumber')
            .sort({ loginTime: 1 });

        // Attach movement logs
        const existingRecords = await Promise.all(records.map(async (rec) => {
            const movements = await MovementLog.find({ attendanceId: rec._id });
            return { ...rec.toObject(), movements };
        }));

        // For daily view: also include all sellers who haven't logged in (Absent)
        if (period === 'daily' || !period) {
            const User = require('../models/User');
            const allSellers = await User.find({ role: 'seller' }, 'name email role phoneNumber');
            const loggedInUserIds = new Set(existingRecords.map(r => r.userId?._id?.toString()).filter(Boolean));

            const absentRecords = allSellers
                .filter(seller => !loggedInUserIds.has(seller._id.toString()))
                .map(seller => ({
                    _id: null,
                    userId: { _id: seller._id, name: seller.name, email: seller.email, role: seller.role, phoneNumber: seller.phoneNumber },
                    date: targetDate,
                    loginTime: null,
                    logoutTime: null,
                    status: 'Absent',
                    mode: null,
                    isActive: false,
                    totalWorkingMinutes: 0,
                    totalOutsideMinutes: 0,
                    movements: []
                }));

            const combined = [...existingRecords, ...absentRecords];
            // Sort: active first, then logged-in, then absent
            combined.sort((a, b) => {
                if (a.isActive && !b.isActive) return -1;
                if (!a.isActive && b.isActive) return 1;
                if (a.status === 'Absent' && b.status !== 'Absent') return 1;
                if (a.status !== 'Absent' && b.status === 'Absent') return -1;
                return (a.userId?.name || '').localeCompare(b.userId?.name || '');
            });

            return res.json(combined);
        }

        res.json(existingRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get office settings
// @route   GET /api/attendance/settings
// @access  Private
const getOfficeSettings = async (req, res) => {
    try {
        const settings = await getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update office settings (admin only)
// @route   PUT /api/attendance/settings
// @access  Private (Admin)
const updateOfficeSettings = async (req, res) => {
    try {
        let settings = await OfficeSettings.findOne();
        if (!settings) settings = new OfficeSettings();

        const { 
            officeLat, officeLng, geofenceRadius, lateThreshold, halfDayThreshold, 
            autoLogoutTime, dailyTarget, adminIncentiveModel, adminCompanyTarget,
            adminIncentivePerExtraSale, adminIncentivePerSeller, adminIncentivePercentage,
            tierBronzeStart, tierBronzePayout, tierSilverStart, tierSilverPayout, tierGoldStart, tierGoldPayout
        } = req.body;
        
        if (officeLat !== undefined) settings.officeLat = officeLat;
        if (officeLng !== undefined) settings.officeLng = officeLng;
        if (geofenceRadius !== undefined) settings.geofenceRadius = geofenceRadius;
        if (lateThreshold) settings.lateThreshold = lateThreshold;
        if (halfDayThreshold) settings.halfDayThreshold = halfDayThreshold;
        if (autoLogoutTime) settings.autoLogoutTime = autoLogoutTime;
        if (dailyTarget !== undefined) settings.dailyTarget = dailyTarget;
        
        if (adminIncentiveModel) settings.adminIncentiveModel = adminIncentiveModel;
        if (adminCompanyTarget !== undefined) settings.adminCompanyTarget = adminCompanyTarget;
        if (adminIncentivePerExtraSale !== undefined) settings.adminIncentivePerExtraSale = adminIncentivePerExtraSale;
        if (adminIncentivePerSeller !== undefined) settings.adminIncentivePerSeller = adminIncentivePerSeller;
        if (adminIncentivePercentage !== undefined) settings.adminIncentivePercentage = adminIncentivePercentage;

        if (tierBronzeStart !== undefined) settings.tierBronzeStart = tierBronzeStart;
        if (tierBronzePayout !== undefined) settings.tierBronzePayout = tierBronzePayout;
        if (tierSilverStart !== undefined) settings.tierSilverStart = tierSilverStart;
        if (tierSilverPayout !== undefined) settings.tierSilverPayout = tierSilverPayout;
        if (tierGoldStart !== undefined) settings.tierGoldStart = tierGoldStart;
        if (tierGoldPayout !== undefined) settings.tierGoldPayout = tierGoldPayout;

        await settings.save();
        res.json({ message: 'Settings updated', settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginAttendance,
    logoutAttendance,
    getTodayStatus,
    geofenceCheck,
    getAdminReport,
    getOfficeSettings,
    updateOfficeSettings
};
