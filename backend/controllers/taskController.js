const Task = require('../models/Task');
const Sale = require('../models/Sale');
const OfficeSettings = require('../models/OfficeSettings');
const mongoose = require('mongoose');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin only)
const createTask = async (req, res) => {
    const { title, description, assignedTo, dueDate } = req.body;

    try {
        const task = await Task.create({
            title,
            description,
            assignedTo,
            dueDate,
            targetCards: req.body.targetCards || 0,
            assignedBy: req.user._id
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all tasks (Admin: all, Seller: assigned)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        let tasks;
        if (req.user.role === 'admin') {
            tasks = await Task.find({}).populate('assignedTo', 'name email');
        } else {
            tasks = await Task.find({ assignedTo: req.user._id }).populate('assignedTo', 'name email');
        }

        const settings = await OfficeSettings.findOne();
        const dailyTargetValue = settings?.dailyTarget || 10;
        const incentivePerCard = 200;

        // Calculate dynamic progress for tasks with card targets
        const tasksWithProgress = await Promise.all(tasks.map(async (task) => {
            const taskObj = task.toObject();
            if (task.targetCards > 0) {
                const startOfDay = new Date(task.createdAt);
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date(task.dueDate);
                endOfDay.setHours(23, 59, 59, 999);

                const sellerIdRaw = task.assignedTo ? (task.assignedTo._id || task.assignedTo) : null;
                const sellerId = sellerIdRaw ? new mongoose.Types.ObjectId(sellerIdRaw.toString()) : null;

                // Group sales by day within the task range
                const dailyPerformance = await Sale.aggregate([
                    {
                        $match: {
                            sellerId: sellerId,
                            status: { $in: ['Approved', 'Pending'] },
                            date: { $gte: startOfDay, $lte: endOfDay }
                        }
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } },
                            count: { $sum: 1 }
                        }
                    }
                ]);

                let totalCount = 0;
                let taskIncentive = 0;
                dailyPerformance.forEach(day => {
                    totalCount += day.count;
                    if (day.count > dailyTargetValue) {
                        taskIncentive += (day.count - dailyTargetValue) * incentivePerCard;
                    }
                });
                
                if (task.status === 'Completed') {
                    taskObj.actualCards = Math.max(totalCount, task.targetCards);
                } else {
                    taskObj.actualCards = totalCount;
                }

                taskObj.incentiveAmount = taskIncentive;
            }
            return taskObj;
        }));

        res.json(tasksWithProgress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update task status or full details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (task) {
            // If seller, only allow status and notes updates
            if (req.user.role !== 'admin') {
                task.status = req.body.status || task.status;
                task.notes = req.body.note || task.notes;
            } else {
                // Admin can update everything
                task.title = req.body.title || task.title;
                task.description = req.body.description || task.description;
                task.assignedTo = req.body.assignedTo || task.assignedTo;
                task.dueDate = req.body.dueDate || task.dueDate;
                task.priority = req.body.priority || task.priority;
                task.targetCards = req.body.targetCards || task.targetCards;
                task.status = req.body.status || task.status;
                task.notes = req.body.note || task.notes;
            }
            
            const updatedTask = await task.save();
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (task) {
            res.json({ message: 'Task removed successfully' });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
