const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user: { type: String, required: true }, 
  userAvatar: { type: String, default: '' },
  
  content: { type: String, default: '' },
  media: [
    {
      uri: String,
      mediaType: String
    }
  ],
  
  isForSale: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  isSold: { type: Boolean, default: false },

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);