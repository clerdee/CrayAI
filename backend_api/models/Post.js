const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  media: [
    {
      uri: String,
      mediaType: String // 'image' or 'video'
    }
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  commentsData: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
      },
      user: String,
      userAvatar: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema);
