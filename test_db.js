require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
    try {
        console.log('Attempting to connect to Atlas...');
        console.log('URI:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Atlas Connected Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        process.exit(1);
    }
};

testConnection();
