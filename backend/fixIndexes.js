const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const AttendanceSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    date: String
}, { collection: 'attendances' });

const Attendance = mongoose.model('AttendanceTemp', AttendanceSchema);

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const collection = mongoose.connection.db.collection('attendances');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        // Let's drop the offending index if it exists
        const offendingIndex = indexes.find(idx => idx.name === 'user_1_date_1');
        if (offendingIndex) {
            console.log('Dropping offending index: user_1_date_1');
            await collection.dropIndex('user_1_date_1');
            console.log('Index dropped successfully');
        } else {
            console.log('Offending index user_1_date_1 not found');
        }

        // Check for null user entries
        const nullUsers = await collection.find({ user: null }).toArray();
        if (nullUsers.length > 0) {
            console.log(`Found ${nullUsers.length} entries with user: null. Deleting them...`);
            await collection.deleteMany({ user: null });
            console.log('Deleted null entries.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixIndexes();
