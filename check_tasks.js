const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User'); // Import User model first
const Task = require('./backend/models/Task');
const Sale = require('./backend/models/Sale');
const OfficeSettings = require('./backend/models/OfficeSettings');

dotenv.config();

const checkTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const tasks = await Task.find({}).populate('assignedTo', 'name email');
        
        const settings = await OfficeSettings.findOne();
        const dailyTargetValue = settings?.dailyTarget || 10;
        
        // Use tiered values if available
        const bronzeStart = settings?.tierBronzeStart || 11;
        const bronzePayout = settings?.tierBronzePayout || 200;
        const silverStart = settings?.tierSilverStart || 16;
        const silverPayout = settings?.tierSilverPayout || 225;
        const goldStart = settings?.tierGoldStart || 21;
        const goldPayout = settings?.tierGoldPayout || 250;

        const tasksWithProgress = await Promise.all(tasks.map(async (task) => {
            const taskObj = task.toObject();
            if (task.targetCards > 0) {
                const startOfDay = new Date(task.createdAt);
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date(task.dueDate);
                endOfDay.setHours(23, 59, 59, 999);

                const sellerIdRaw = task.assignedTo ? (task.assignedTo._id || task.assignedTo) : null;
                const sellerId = sellerIdRaw ? new mongoose.Types.ObjectId(sellerIdRaw.toString()) : null;

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
                    // Apply tiered logic
                    for (let i = 1; i <= day.count; i++) {
                        if (i >= goldStart) {
                            taskIncentive += goldPayout;
                        } else if (i >= silverStart) {
                            taskIncentive += silverPayout;
                        } else if (i >= bronzeStart) {
                            taskIncentive += bronzePayout;
                        }
                    }
                });
                
                if (task.status === 'Completed') {
                    taskObj.actualCards = Math.max(totalCount, task.targetCards);
                } else {
                    taskObj.actualCards = totalCount;
                }

                // Fallback for missing records
                if (taskObj.actualCards > totalCount) {
                    let fallbackIncentive = 0;
                    for (let i = totalCount + 1; i <= taskObj.actualCards; i++) {
                         if (i >= goldStart) fallbackIncentive += goldPayout;
                         else if (i >= silverStart) fallbackIncentive += silverPayout;
                         else if (i >= bronzeStart) fallbackIncentive += bronzePayout;
                    }
                    taskIncentive += fallbackIncentive;
                }

                taskObj.incentiveAmount = taskIncentive;
            }
            return taskObj;
        }));

        console.log('Tasks with detailed progress:');
        console.log(JSON.stringify(tasksWithProgress, null, 2));
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkTasks();
