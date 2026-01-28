const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your JWT middleware
const notificationController = require('../controllers/notificationController');

router.get('/', auth, notificationController.getNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.post('/mark-read', auth, notificationController.markAllRead);

module.exports = router;