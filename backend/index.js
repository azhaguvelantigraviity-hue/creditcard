const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

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
            geofenceRadius: 100
        });
        console.log('OfficeSettings initialized with dailyTarget: 10');
    }
});

const app = express();

// Middleware
app.use(cors());
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
