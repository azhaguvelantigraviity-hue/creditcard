const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, updateFaceDescriptor } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/face', updateFaceDescriptor);
router.delete('/:id', deleteUser);

module.exports = router;
