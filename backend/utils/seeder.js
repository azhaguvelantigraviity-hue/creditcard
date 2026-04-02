const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Sale = require('../models/Sale');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for Seeding...');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Lead.deleteMany();
        await Task.deleteMany();
        await Attendance.deleteMany();
        await Sale.deleteMany();

        // Create Admin
        const admin = await User.create({
            name: 'SBI Admin',
            email: 'admin@sbi.com',
            password: 'adminpassword', // Will be hashed by pre-save hook
            role: 'admin',
            phoneNumber: '9876543210'
        });

        // Create Sellers
        const seller1 = await User.create({
            name: 'Rahul Sharma',
            email: 'rahul@sbi.com',
            password: 'sellerpassword',
            role: 'seller',
            phoneNumber: '9123456780'
        });

        const seller2 = await User.create({
            name: 'Priya Verma',
            email: 'priya@sbi.com',
            password: 'sellerpassword',
            role: 'seller',
            phoneNumber: '9234567810'
        });

        console.log('Users Seeded!');

        // Create Leads
        const leads = await Lead.insertMany([
            { name: 'Anil Kapoor', phoneNumber: '9111111111', email: 'anil@gmail.com', status: 'Interested', assignedTo: seller1._id },
            { name: 'Suman Lata', phoneNumber: '9222222222', email: 'suman@yahoo.com', status: 'Converted', assignedTo: seller2._id },
            { name: 'Vikram Singh', phoneNumber: '9333333333', email: 'vikram@outlook.com', status: 'New', assignedTo: seller1._id },
        ]);

        console.log('Leads Seeded!');

        // Create Tasks
        await Task.insertMany([
            { title: 'Follow up with Anil', description: 'Check if document collected', assignedTo: seller1._id, assignedBy: admin._id, dueDate: new Date() },
            { title: 'Weekly Report', description: 'Submit by Friday', assignedTo: seller2._id, assignedBy: admin._id, dueDate: new Date() },
        ]);

        console.log('Tasks Seeded!');

        // Create Sales
        await Sale.insertMany([
            { sellerId: seller2._id, leadId: leads[1]._id, applicationId: 'APP12456', cardType: 'SBI Elite', amount: 5000, status: 'Approved' },
        ]);

        console.log('Sales Seeded!');

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

connectDB().then(seedData);
