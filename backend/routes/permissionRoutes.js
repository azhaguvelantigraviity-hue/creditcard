const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { createPermission, getPermissions, updatePermissionStatus, deletePermission } = require('../controllers/permissionController');

router.route('/')
    .post(protect, createPermission)
    .get(protect, getPermissions);

router.route('/:id/status')
    .patch(protect, admin, updatePermissionStatus);

router.route('/:id')
    .delete(protect, deletePermission);

module.exports = router;
