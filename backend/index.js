const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const taskRoutes = require('./routes/taskRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const salesRoutes = require('./routes/salesRoutes');
const statsRoutes = require('./routes/statsRoutes');
const callLogRoutes = require('./routes/callLogRoutes');
const userRoutes = require('./routes/userRoutes');
const incentiveRoutes = require('./routes/incentiveRoutes');
const permissionRoutes = require('./routes/permissionRoutes');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(async () => {
    // Initialize OfficeSettings if not exists
    const OfficeSettings = require('./models/OfficeSettings');
    const settings = await OfficeSettings.findOne();
    if (!settings) {
        await OfficeSettings.create({
            dailyTarget: 10,
            officeLat: 12.9610,
            officeLng: 77.5127,
            geofenceRadius: 100,
            adminIncentiveModel: 'percentage',
            adminCompanyTarget: 150,
            adminIncentivePerExtraSale: 50,
            adminIncentivePerSeller: 100,
            adminIncentivePercentage: 5
        });
        console.log('OfficeSettings initialized with dailyTarget: 10');
    } else {
        // Migration for existing DBs
        let updated = false;
        if (!settings.adminIncentiveModel) { settings.adminIncentiveModel = 'percentage'; updated = true; }
        if (settings.adminCompanyTarget === undefined) { settings.adminCompanyTarget = 150; updated = true; }
        if (settings.adminIncentivePerExtraSale === undefined) { settings.adminIncentivePerExtraSale = 50; updated = true; }
        if (settings.adminIncentivePerSeller === undefined) { settings.adminIncentivePerSeller = 100; updated = true; }
        if (settings.adminIncentivePercentage === undefined) { settings.adminIncentivePercentage = 5; updated = true; }
        
        if (settings.tierBronzeStart === undefined) { settings.tierBronzeStart = 11; updated = true; }
        if (settings.tierBronzePayout === undefined) { settings.tierBronzePayout = 200; updated = true; }
        if (settings.tierSilverStart === undefined) { settings.tierSilverStart = 16; updated = true; }
        if (settings.tierSilverPayout === undefined) { settings.tierSilverPayout = 225; updated = true; }
        if (settings.tierGoldStart === undefined) { settings.tierGoldStart = 21; updated = true; }
        if (settings.tierGoldPayout === undefined) { settings.tierGoldPayout = 250; updated = true; }
        
        if (updated) {
            await settings.save();
            console.log('OfficeSettings updated with new defaults');
        }
    }

    // Initialize default accounts if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
        console.log('Database empty. Initializing default accounts...');
        
        // Admin
        await User.create({
            name: 'SBI Admin',
            email: 'admin@sbi.com',
            password: 'adminpassword',
            role: 'admin',
            phoneNumber: '9876543210'
        });

        // Team Leader
        await User.create({
            name: 'Vikram Singh (TL)',
            email: 'tl@sbi.com',
            password: 'SBI@1234',
            role: 'tl',
            phoneNumber: '9000000001'
        });
        
        console.log('Default Admin and TL accounts created.');
    }
});

const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://creditcard-eight-sigma.vercel.app',
        process.env.FRONTEND_URL || 'https://sbi-frontend.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/calls', callLogRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incentives', incentiveRoutes);
app.use('/api/permissions', permissionRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'SBI Credit Card Sales Management API is running...' });
});

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
