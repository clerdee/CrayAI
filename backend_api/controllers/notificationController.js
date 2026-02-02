const Notification = require('../models/Notification');

// GET /api/notification
// Fetch list for the screen
exports.getNotifications = async (req, res) => {
  try {
    // Ensure req.user exists
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.userId;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'firstName lastName profilePic') // Vital for the UI avatar/name
      .sort({ createdAt: -1 }) // Newest first
      .limit(50); // Limit to last 50 to keep it fast

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Noti Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /api/notification/unread-count
// For the badge number
exports.getUnreadCount = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.userId;
    const count = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    console.error("Count Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// PUT /api/notification/read-all
// Called when user pulls down to refresh
exports.markAllRead = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.userId;
    
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({ success: true, message: "All marked as read" });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// PUT /api/notification/:id/read
// Called when user clicks a specific notification
exports.markOneRead = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.userId;
    const notificationId = req.params.id;

    // Find and update specific notification, ensuring it belongs to the user
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark One Read Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};