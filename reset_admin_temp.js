const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/User');

dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const result = await User.updateOne(
            { email: 'admin@sbi.com' },
            { $set: { password: hashedPassword } }
        );
        
        if (result.matchedCount > 0) {
            console.log('Admin password reset successfully to: admin123');
        } else {
            console.log('Admin user not found. Creating a new one...');
            await User.create({
                name: 'SBI Admin',
                email: 'admin@sbi.com',
                password: 'admin123',
                role: 'admin',
                phoneNumber: '9876543210'
            });
            console.log('New Admin created with password: admin123');
        }
        
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetAdmin();
