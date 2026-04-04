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

// Helper to calculate Euclidean distance between two descriptors
const getDistance = (descriptor1, descriptor2) => {
    if (descriptor1.length !== descriptor2.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
        sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    return Math.sqrt(sum);
};

// @desc    Auth user via face descriptor
// @route   POST /api/auth/face-login
// @access  Public
const faceLogin = async (req, res) => {
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor)) {
        return res.status(400).json({ message: 'Invalid face descriptor' });
    }

    try {
        const users = await User.find({ status: 'active', faceDescriptor: { $exists: true, $not: { $size: 0 } } });
        
        let bestMatch = null;
        let minDistance = 0.6; // Threshold for face matching

        for (const user of users) {
            const distance = getDistance(descriptor, user.faceDescriptor);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = user;
            }
        }

        if (bestMatch) {
            res.json({
                _id: bestMatch._id,
                name: bestMatch.name,
                email: bestMatch.email,
                role: bestMatch.role,
                phoneNumber: bestMatch.phoneNumber,
                profilePic: bestMatch.profilePic,
                token: generateToken(bestMatch._id)
            });
        } else {
            res.status(401).json({ message: 'Face not recognized. Please use password login or contact admin.' });
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
    faceLogin,
    logoutUser,
    getUserProfile
};
