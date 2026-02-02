const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment'); // <--- Import New Model
const { createNotification } = require('../utils/notificationHelper'); 

// 1. CREATE POST
exports.createPost = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { content, media } = req.body;

    if (!content && (!media || media.length === 0)) {
      return res.status(400).json({ message: 'Post must have content or media' });
    }

    const user = await User.findById(userId).select('firstName lastName profilePic');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = new Post({
      userId,
      user: `${user.firstName} ${user.lastName}`,
      userAvatar: user.profilePic,
      content: content || '',
      media: media || [],
      likes: [],
      commentsCount: 0,
      createdAt: new Date()
    });

    await post.save();

    res.status(201).json({ success: true, message: 'Post created', post });
  } catch (error) {
    console.error('Create Post Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 2. GET ALL POSTS (Feed)
exports.getAllPosts = async (req, res) => {
  try {
    // 1. Get posts
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName profilePic')
      .lean(); // Convert to plain object to attach comments

    // 2. Fetch comments for each post manually
    // (In a large app, you would load comments only when "Show Comments" is clicked, 
    // but this maintains your current functionality)
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const comments = await Comment.find({ postId: post._id })
        .sort({ createdAt: 1 })
        .populate('userId', 'firstName lastName profilePic');

      const formattedComments = comments.map(c => ({
        _id: c._id,
        text: c.text,
        userId: c.userId?._id,
        user: c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'Unknown',
        userAvatar: c.userId?.profilePic,
        createdAt: c.createdAt
      }));

      return {
        ...post,
        commentsData: formattedComments, // Re-attach so frontend doesn't break
        showComments: false
      };
    }));

    res.status(200).json({
      success: true,
      posts: postsWithComments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 3. LIKE/UNLIKE POST
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
      // Trigger Notification
      if (post.userId.toString() !== userId) {
        await createNotification({
          recipient: post.userId, 
          sender: userId, 
          type: 'like', 
          postId: post._id, 
          text: 'liked your post.' 
        });
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: hasLiked ? 'Post unliked' : 'Post liked',
      post
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 4. GET USER INFO
exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('firstName lastName profilePic following');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        profilePic: user.profilePic,
        following: user.following || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// 5. DELETE POST (Cascade Delete Comments)
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    // DELETE ALL COMMENTS ASSOCIATED WITH THIS POST
    await Comment.deleteMany({ postId: postId });

    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 6. UPDATE POST
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;
    const { content, media } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    post.content = content || post.content;
    if (media) post.media = media;

    await post.save();
    await post.populate('userId', 'firstName lastName profilePic');

    res.json({ success: true, message: "Post updated", post });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};