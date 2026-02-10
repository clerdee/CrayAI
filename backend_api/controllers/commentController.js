const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');

// 1. POST A COMMENT
exports.postComment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { postId } = req.params;
    const { text } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment empty' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Create the Comment
    const newComment = new Comment({
      postId,
      userId,
      text: text.trim(),
      createdAt: new Date()
    });

    await newComment.save();

    // Increment Post comment count
    post.commentsCount = (post.commentsCount || 0) + 1;
    
    // Add comment ID to post's comment array if your schema uses it
    if (post.comments) {
      post.comments.push(newComment._id);
    }
    
    await post.save();

    // Fetch user details for immediate display on frontend
    const user = await User.findById(userId).select('firstName lastName profilePic');

    // Notify Post Author (if not commenting on own post)
    if (post.userId.toString() !== userId) {
      await createNotification({
        recipient: post.userId,
        sender: userId,
        type: 'comment',
        post: post._id, // Ensure consistent field name with Notification model
        text: 'commented on your post.'
      });
    }

    // Format response to match frontend expectations
    const commentResponse = {
        _id: newComment._id,
        text: newComment.text,
        userId: userId,
        user: `${user.firstName} ${user.lastName}`,
        userAvatar: user.profilePic,
        createdAt: newComment.createdAt
    };

    res.status(200).json({ success: true, message: 'Comment posted', newComment: commentResponse });
  } catch (error) {
    console.error('Post Comment Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 2. DELETE COMMENT
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;

    // 1. Find the comment
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // 2. Check ownership (Only the comment author can delete)
    if (comment.userId.toString() !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 3. Remove Comment from Database
    await Comment.findByIdAndDelete(commentId);

    // 4. Update Post: Decrement count & remove ID reference
    const post = await Post.findById(postId);
    if (post) {
      post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
      if (post.comments) {
        post.comments.pull(commentId);
      }
      await post.save();
    }

    // 5. --- CLEANUP NOTIFICATION ---
    // Remove the notification associated with this specific action to prevent ghost alerts
    await Notification.findOneAndDelete({
      type: 'comment',
      sender: userId,
      post: postId 
      // Note: If a user comments multiple times, this might delete the wrong notification 
      // if your schema doesn't link specific commentIDs. 
      // For basic purposes, deleting the most recent match is usually acceptable.
    });

    res.status(200).json({ success: true, message: 'Comment deleted' });

  } catch (error) {
    console.error('Delete Comment Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 3. EDIT A COMMENT
exports.editComment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment empty' });

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Authorization: Only Comment Owner can edit
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    comment.text = text.trim();
    await comment.save();

    res.status(200).json({ success: true, message: 'Comment updated', comment });
  } catch (error) {
    console.error('Edit Comment Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};