const User = require('../models/User');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
    try {
        const { name, email, role, phoneNumber, status, faceDescriptor } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Default password for new staff
        const password = 'SBI@' + Math.floor(1000 + Math.random() * 9000);

        const user = await User.create({
            name,
            email,
            password, 
            role: role || 'seller',
            phoneNumber: phoneNumber || '0000000000',
            status: status || 'active',
            faceDescriptor: faceDescriptor || []
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                tempPassword: password // Send back so admin can provide it to staff
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.status = req.body.status || user.status;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user face descriptor
// @route   PUT /api/users/:id/face
// @access  Private/Admin
const updateFaceDescriptor = async (req, res) => {
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor)) {
        return res.status(400).json({ message: 'Invalid face descriptor' });
    }

    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.faceDescriptor = descriptor;
            await user.save();
            res.json({ message: 'Face descriptor updated successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    updateFaceDescriptor
};
