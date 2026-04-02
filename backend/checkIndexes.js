const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Attendance = require('./models/Attendance');

dotenv.config();

const checkIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const indexes = await Attendance.collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));
        
        // Let's also check for any entries with null userId or user field
        const nullUserId = await Attendance.find({ userId: null });
        console.log('Entries with null userId:', nullUserId.length);
        
        const userFieldEntries = await Attendance.find({ user: { $exists: true } });
        console.log('Entries with "user" field:', userFieldEntries.length);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkIndexes();
