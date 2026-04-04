const express = require('express');
const router = express.Router();
const { 
    getIncentiveStats, 
    getIncentiveLedger, 
    getMonthlyIncentiveStats,
    getAdminIncentiveSummary,
    getDashboardIncentives 
} = require('../controllers/incentiveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get aggregate stats
// @route   GET /api/incentives/stats
router.get('/stats', protect, getIncentiveStats);

// @desc    Get detailed ledger
// @route   GET /api/incentives/ledger
router.get('/ledger', protect, getIncentiveLedger);

// @desc    Get monthly performance
// @route   GET /api/incentives/monthly
router.get('/monthly', protect, getMonthlyIncentiveStats);

// @desc    Get incentive summary for dashboard (admin & seller)
// @route   GET /api/incentives/dashboard-summary
router.get('/dashboard-summary', protect, getDashboardIncentives);

// @desc    Get aggregate incentive summary for all sellers (Admin Only)
// @route   GET /api/incentives/admin/summary
router.get('/admin/summary', protect, authorize('admin'), getAdminIncentiveSummary);

module.exports = router;
