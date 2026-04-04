const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { createPermission, getPermissions, updatePermissionStatus } = require('../controllers/permissionController');

router.route('/')
    .post(protect, createPermission)
    .get(protect, getPermissions);

router.route('/:id/status')
    .patch(protect, admin, updatePermissionStatus);

module.exports = router;
