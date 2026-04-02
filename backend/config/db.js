const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Fix legacy index issue
        try {
            const collection = conn.connection.db.collection('attendances');
            const indexes = await collection.indexes();
            if (indexes.find(idx => idx.name === 'user_1_date_1')) {
                console.log('Dropping legacy index: user_1_date_1');
                await collection.dropIndex('user_1_date_1');
            }
            
            // Clean up any bad legacy data where userId might be missing
            // This is a safety measure to prevent E11000 on the new index too
            await collection.deleteMany({ userId: { $exists: false } });
            await collection.deleteMany({ userId: null });
            await collection.deleteMany({ user: { $exists: true } }); // Clean up any old documents using "user" instead of "userId"
            
        } catch (indexError) {
            console.log('Index cleanup skipped or not needed');
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
