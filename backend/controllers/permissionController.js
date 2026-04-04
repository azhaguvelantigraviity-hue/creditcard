const Permission = require('../models/Permission');

// @desc    Create a new permission request
// @route   POST /api/permissions
// @access  Private (Seller)
const createPermission = async (req, res) => {
    try {
        const { date, startTime, endTime, duration, type, reason } = req.body;
        const permission = await Permission.create({
            userId: req.user._id,
            date,
            startTime,
            endTime,
            duration,
            type,
            reason
        });
        res.status(201).json(permission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all permission requests (Admin: all, Seller: own)
// @route   GET /api/permissions
// @access  Private
const getPermissions = async (req, res) => {
    try {
        let permissions;
        if (req.user.role === 'admin') {
            permissions = await Permission.find({}).populate('userId', 'name email role').sort({ createdAt: -1 });
        } else {
            permissions = await Permission.find({ userId: req.user._id }).sort({ createdAt: -1 });
        }
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update permission status (Admin only)
// @route   PATCH /api/permissions/:id/status
// @access  Private (Admin)
const updatePermissionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const permission = await Permission.findById(req.params.id).populate('userId', 'name email');
        if (!permission) {
            return res.status(404).json({ message: 'Permission request not found' });
        }

        permission.status = status;
        await permission.save();

        res.json(permission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createPermission,
    getPermissions,
    updatePermissionStatus
};
