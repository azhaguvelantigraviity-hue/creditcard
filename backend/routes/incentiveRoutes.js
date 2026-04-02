const express = require('express');
const router = express.Router();
const { getIncentiveStats, getIncentiveLedger, getMonthlyIncentiveStats } = require('../controllers/incentiveController');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get aggregate stats
// @route   GET /api/incentives/stats
router.get('/stats', protect, getIncentiveStats);

// @desc    Get detailed ledger
// @route   GET /api/incentives/ledger
router.get('/ledger', protect, getIncentiveLedger);

// @desc    Get monthly performance
// @route   GET /api/incentives/monthly
router.get('/monthly', protect, getMonthlyIncentiveStats);

module.exports = router;
