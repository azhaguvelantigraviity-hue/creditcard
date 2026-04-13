const Task = require('../models/Task');
const User = require('../models/User');
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
        } else if (req.user.role === 'tl') {
            const teamUsers = await User.find({ teamLeaderId: req.user._id }).select('_id');
            const teamIds = teamUsers.map(u => u._id);
            teamIds.push(req.user._id);
            tasks = await Task.find({ assignedTo: { $in: teamIds } }).populate('assignedTo', 'name email').sort({ createdAt: -1 });
        } else {
            tasks = await Task.find({ assignedTo: req.user._id }).populate('assignedTo', 'name email').sort({ createdAt: -1 });
        }

        const settings = await OfficeSettings.findOne();
        
        // Tiered settings from OfficeSettings
        const bronzeStart = settings?.tierBronzeStart || 11;
        const silverStart = settings?.tierSilverStart || 16;
        const goldStart = settings?.tierGoldStart || 21;
        
        const bronzePayout = settings?.tierBronzePayout || 200;
        const silverPayout = settings?.tierSilverPayout || 225;
        const goldPayout = settings?.tierGoldPayout || 250;

        // Calculate dynamic progress for tasks with card targets
        const tasksWithProgress = await Promise.all(tasks.map(async (task) => {
            const taskObj = task.toObject();
            if (task.targetCards > 0) {
                // Ensure we cover the full range of days in Asia/Kolkata
                const startOfDay = new Date(task.createdAt);
                startOfDay.setHours(0, 0, 0, 0);
                startOfDay.setMinutes(startOfDay.getMinutes() - 330); // Offset to start of day in UTC for IST 00:00
                
                const endOfDay = new Date(task.dueDate);
                endOfDay.setHours(23, 59, 59, 999);
                // endOfDay is already likely the end of that UTC day, which is 5:29 AM next day IST.
                // To be safe, let's make it the absolute end of the target day.

                const sellerIdRaw = task.assignedTo ? (task.assignedTo._id || task.assignedTo) : null;
                if (!sellerIdRaw) {
                    taskObj.actualCards = 0;
                    taskObj.incentiveAmount = 0;
                    return taskObj;
                }
                const sellerId = new mongoose.Types.ObjectId(sellerIdRaw.toString());

                // Separate Sold (Approved) and Pending counts within the task range
                const performance = await Sale.aggregate([
                    {
                        $match: {
                            sellerId: sellerId,
                            status: { $in: ['Approved', 'Pending'] },
                            date: { $gte: startOfDay, $lte: endOfDay }
                        }
                    },
                    {
                        $group: {
                            _id: { 
                                date: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } },
                                status: "$status"
                            },
                            count: { $sum: 1 }
                        }
                    }
                ]);

                let totalSold = 0;
                let totalPending = 0;
                let taskIncentive = 0;

                // Daily tiered logic should ideally only apply to Approved (Sold) cards
                // Group back by date to apply tiered logic properly
                const dailyMap = {};
                performance.forEach(entry => {
                    const { date, status } = entry._id;
                    if (!dailyMap[date]) dailyMap[date] = 0;
                    
                    if (status === 'Approved') {
                        totalSold += entry.count;
                        dailyMap[date] += entry.count;
                    } else if (status === 'Pending') {
                        totalPending += entry.count;
                        // Depending on business rules, sometimes pending also counts for a "potential" incentive 
                        // shown in the task, but we'll stick to Approved for the final amount calculation
                    }
                });

                Object.values(dailyMap).forEach(dayApprovedCount => {
                    for (let i = 1; i <= dayApprovedCount; i++) {
                        if (i >= goldStart) taskIncentive += goldPayout;
                        else if (i >= silverStart) taskIncentive += silverPayout;
                        else if (i >= bronzeStart) taskIncentive += bronzePayout;
                    }
                });
                
                if (task.status === 'Completed') {
                    taskObj.soldCards = Math.max(totalSold, task.targetCards);
                    taskObj.pendingCards = totalPending;
                } else {
                    taskObj.soldCards = totalSold;
                    taskObj.pendingCards = totalPending;
                }
                
                taskObj.actualCards = taskObj.soldCards + taskObj.pendingCards;
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
            // If seller, only allow status and notes updates (Admin & TL can edit everything)
            if (req.user.role === 'seller') {
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
