const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// 1. GET ALL CONTENT (Posts & Comments) FOR MODERATION
exports.getModerationContent = async (req, res) => {
  try {
    // A. Fetch All Posts
    const posts = await Post.find()
      .populate('userId', 'firstName lastName profilePic email') // Fetch profile info
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
      // 👇 IMPORTANT: Send Author as an Object with profilePic
      author: {
        name: p.userId ? `${p.userId.firstName} ${p.userId.lastName}` : 'Unknown',
        email: p.userId?.email || 'N/A',
        profilePic: p.userId?.profilePic || null 
      },
      content: p.content || (p.media?.length ? '[Media Content]' : '[Empty]'),
      reason: 'New Content',
      severity: 'Low',      
      timestamp: p.createdAt,
      status: p.moderationStatus || 'Pending', // Ensure your DB has this field
      actionTaken: p.moderationStatus === 'Resolved' ? 'Approved' : null,
      media: p.media
    }));

    // D. Format Comments
    const formattedComments = comments.map(c => ({
      id: c._id,
      type: 'Comment',
      // 👇 IMPORTANT: Same here for Comments
      author: {
        name: c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'Unknown',
        email: c.userId?.email || 'N/A',
        profilePic: c.userId?.profilePic || null
      },
      content: c.text,
      reason: 'New Comment',
      severity: 'Low',
      timestamp: c.createdAt,
      status: c.moderationStatus || 'Pending',
      actionTaken: c.moderationStatus === 'Resolved' ? 'Approved' : null
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

// 2. MODERATE CONTENT (Approve OR Delete)
exports.moderateContent = async (req, res) => {
  try {
    const { id, type } = req.params; 
    const { status } = req.body; // Expecting 'Approved' or 'Deleted'

    const Model = type === 'Post' ? Post : Comment;
    
    if (status === 'Deleted') {
        // Option A: Hard Delete (Permanently remove)
        await Model.findByIdAndDelete(id);
        
        // Option B: Soft Delete (Hide but keep record) - UNCOMMENT TO USE
        // await Model.findByIdAndUpdate(id, { moderationStatus: 'Rejected', isVisible: false });
    } 
    else if (status === 'Approved') {
        // ✅ Updates status to 'Resolved' so it disappears from Pending list
        await Model.findByIdAndUpdate(id, { moderationStatus: 'Resolved' });
    } else {
        return res.status(400).json({ message: "Invalid status action" });
    }

    res.status(200).json({ success: true, message: `${type} ${status} successfully` });
  } catch (error) {
    console.error("Moderation Action Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};