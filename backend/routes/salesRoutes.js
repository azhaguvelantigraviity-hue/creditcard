const express = require('express');
const router = express.Router();
const { createSale, getSales, updateSaleStatus, getSalesStats } = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
    .post(protect, createSale)
    .get(protect, getSales);

router.route('/stats')
    .get(protect, getSalesStats);

router.route('/:id')
    .put(protect, authorize('admin'), updateSaleStatus);

module.exports = router;
