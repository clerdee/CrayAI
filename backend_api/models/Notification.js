const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // The person RECEIVING the notification
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // The person DOING the action (e.g., the liker)
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: { 
    type: String, 
    enum: ['like', 'comment', 'follow', 'message', 'request'], 
    required: true 
  },
  
  // Optional links to resources
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  chatId: { type: String }, 
  
  text: { type: String }, // e.g. "Liked your post"
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', NotificationSchema);