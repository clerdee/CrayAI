const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Ensure this path is correct
const notificationController = require('../controllers/notificationController');

// Apply auth middleware to ALL routes in this file
router.use(auth);

// GET Routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);

// PUT Routes (Matching frontend calls)
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markOneRead);

module.exports = router;