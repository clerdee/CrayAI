const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  image: { type: String, default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  lastMessage: { type: String },
  lastMessageTime: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'blocked'], 
    default: 'pending' 
  },
  
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);