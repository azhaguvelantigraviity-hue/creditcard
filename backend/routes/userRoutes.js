const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, updateFaceDescriptor } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', authorize('admin', 'tl'), getUsers);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.put('/:id/face', authorize('admin'), updateFaceDescriptor);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
