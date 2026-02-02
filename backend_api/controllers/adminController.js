// controllers/adminController.js
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// 1. GET ALL CONTENT (Posts & Comments) FOR MODERATION
exports.getModerationContent = async (req, res) => {
  try {
    // A. Fetch All Posts
    const posts = await Post.find()
      .populate('userId', 'firstName lastName profilePic email')
      .sort({ createdAt: -1 })
      .lean();

    // B. Fetch All Comments
    const comments = await Comment.find()
      .populate('userId', 'firstName lastName profilePic email')
      .sort({ createdAt: -1 })
      .lean();

    // C. Format Posts
    const formattedPosts = posts.map(p => ({
      id: p._id,
      type: 'Post',
      author: p.userId ? `${p.userId.firstName} ${p.userId.lastName}` : 'Unknown',
      email: p.userId?.email || 'N/A',
      content: p.content || (p.media?.length ? '[Media Content]' : '[Empty]'),
      reason: 'New Content', // Placeholder until you add AI detection
      severity: 'Low',       // Placeholder
      timestamp: p.createdAt,
      status: 'Pending',     // You could add a 'status' field to your schema later
      media: p.media
    }));

    // D. Format Comments
    const formattedComments = comments.map(c => ({
      id: c._id,
      type: 'Comment',
      author: c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'Unknown',
      email: c.userId?.email || 'N/A',
      content: c.text,
      reason: 'New Comment',
      severity: 'Low',
      timestamp: c.createdAt,
      status: 'Pending'
    }));

    // E. Combine and Sort by Newest
    const allContent = [...formattedPosts, ...formattedComments].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.status(200).json({ success: true, items: allContent });

  } catch (error) {
    console.error("Moderation Fetch Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 2. ADMIN DELETE CONTENT (Handles both types)
exports.deleteContent = async (req, res) => {
  try {
    const { id, type } = req.params; // Expects type to be 'Post' or 'Comment'

    if (type === 'Post') {
        await Post.findByIdAndDelete(id);
        // Optional: Delete associated comments if you want strict cleanup
        await Comment.deleteMany({ postId: id });
    } else if (type === 'Comment') {
        await Comment.findByIdAndDelete(id);
    } else {
        return res.status(400).json({ message: "Invalid content type" });
    }

    res.status(200).json({ success: true, message: `${type} deleted successfully` });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};