const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
    .post(protect, authorize('admin'), createTask)
    .get(protect, getTasks);

router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, authorize('admin'), deleteTask);

module.exports = router;
