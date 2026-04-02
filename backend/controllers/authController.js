const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (Only Admin will ideally create sellers, but keeping this for setup)
const registerUser = async (req, res) => {
    const { name, email, password, role, phoneNumber } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            phoneNumber
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // New: Automated Attendance Tracking
            if (user.role === 'seller') {
                const today = new Date().toISOString().split('T')[0];
                let attendance = await Attendance.findOne({ userId: user._id, date: today });
                
                if (!attendance) {
                    await Attendance.create({
                        userId: user._id,
                        date: today,
                        loginTime: new Date(),
                        mode: 'remote', // Defaulting to remote for auth-based login
                        status: 'On Time', // Initial status
                        isActive: true
                    });
                } else if (!attendance.isActive) {
                    // Re-activate if they logged back in after a logout same day
                    attendance.isActive = true;
                    attendance.loginTime = new Date();
                    attendance.logoutTime = undefined;
                    await attendance.save();
                }
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                profilePic: user.profilePic,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout user & update attendance
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ 
            userId: req.user._id, 
            date: today, 
            isActive: true 
        });

        if (attendance) {
            const logoutTime = new Date();
            const workingMs = logoutTime - attendance.loginTime;
            const workingMinutes = Math.floor(workingMs / 60000);
            
            attendance.logoutTime = logoutTime;
            attendance.isActive = false;
            attendance.totalWorkingMinutes = Math.max(0, workingMinutes - (attendance.totalOutsideMinutes || 0));
            await attendance.save();
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            profilePic: user.profilePic
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile
};
