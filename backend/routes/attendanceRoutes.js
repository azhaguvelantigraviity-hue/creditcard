const express = require('express');
const router = express.Router();
const {
    loginAttendance,
    logoutAttendance,
    getTodayStatus,
    geofenceCheck,
    getAdminReport,
    getOfficeSettings,
    updateOfficeSettings
} = require('../controllers/attendanceController');
const { logExit, logReEntry, getMovementLogs } = require('../controllers/movementController');
const { protect, admin } = require('../middleware/authMiddleware');

// Staff routes
router.post('/login', protect, loginAttendance);
router.post('/logout', protect, logoutAttendance);
router.get('/today', protect, getTodayStatus);
router.post('/geofence-check', protect, geofenceCheck);

// Movement tracking
router.post('/movement/exit', protect, logExit);
router.post('/movement/reentry', protect, logReEntry);
router.get('/movement', protect, getMovementLogs);

// Admin routes
router.get('/admin', protect, getAdminReport);

// Settings
router.get('/settings', protect, getOfficeSettings);
router.put('/settings', protect, updateOfficeSettings);

module.exports = router;
