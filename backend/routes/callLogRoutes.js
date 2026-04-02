const express = require('express');
const router = express.Router();
const { createCallLog, getCallLogs, getCallStats } = require('../controllers/callLogController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createCallLog);
router.get('/', getCallLogs);
router.get('/stats', getCallStats);

module.exports = router;
