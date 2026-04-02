const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const fix = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to:', process.env.MONGO_URI);
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const collection = db.collection('attendances');
    
    // List indexes
    const indexes = await collection.indexes();
    console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

    // Check for user_1_date_1
    const hasBadIndex = indexes.find(i => i.name === 'user_1_date_1');
    if (hasBadIndex) {
      console.log('Dropping bad index: user_1_date_1');
      await collection.dropIndex('user_1_date_1');
      console.log('Dropped successfully.');
    }

    // Also check for user_id_1_date_1 (the correct one is userId_1_date_1)
    // Wait, the model says userId: 1, date: 1.
    
    // Clean up any records with missing userId
    const result = await collection.deleteMany({ userId: { $exists: false } });
    console.log('Deleted records missing userId:', result.deletedCount);

    const resultNull = await collection.deleteMany({ userId: null });
    console.log('Deleted records with null userId:', resultNull.deletedCount);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

fix();
