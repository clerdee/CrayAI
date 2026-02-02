const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
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
    await post.save();

    // Fetch user details for immediate display
    const user = await User.findById(userId).select('firstName lastName profilePic');

    // Notify Post Author
    if (post.userId.toString() !== userId) {
      await createNotification({
        recipient: post.userId,
        sender: userId,
        type: 'comment',
        postId: post._id,
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

// 2. DELETE A COMMENT
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { postId, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const post = await Post.findById(postId);
    
    // Authorization: Comment Owner OR Post Owner can delete
    if (comment.userId.toString() !== userId && post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Comment.findByIdAndDelete(commentId);

    // Decrement count
    if (post.commentsCount > 0) {
        post.commentsCount = post.commentsCount - 1;
        await post.save();
    }

    res.status(200).json({ success: true, message: 'Comment deleted', commentId });
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