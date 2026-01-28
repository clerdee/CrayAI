const Notification = require('../models/Notification');

// GET /api/notification
// Fetch list for the screen
exports.getNotifications = async (req, res) => {
  try {
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
    const userId = req.user.userId;
    const count = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST /api/notification/mark-read
// Call this when user opens the screen (Optional but recommended)
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};