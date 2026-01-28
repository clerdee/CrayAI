const User = require('../models/User');
const Post = require('../models/Post');
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
      commentsData: [],
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
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName profilePic');

    res.status(200).json({
      success: true,
      posts: posts.map(post => ({
        _id: post._id,
        userId: post.userId?._id, 
        user: post.user,
        userAvatar: post.userAvatar,
        content: post.content,
        media: post.media,
        likes: post.likes,
        commentsData: post.commentsData,
        createdAt: post.createdAt,
        showComments: false
      }))
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
      await createNotification({
        recipient: post.userId, 
        sender: userId, 
        type: 'like', 
        postId: post._id, 
        text: 'liked your post.' 
      });
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

// 4. POST COMMENT
exports.postComment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { postId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment empty' });

    const user = await User.findById(userId).select('firstName lastName profilePic');
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
      user: `${user.firstName} ${user.lastName}`,
      userAvatar: user.profilePic,
      userId: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.commentsData.push(newComment);
    await post.save();

    // Trigger Notification
    await createNotification({
      recipient: post.userId, 
      sender: userId, 
      type: 'comment', 
      postId: post._id, 
      text: 'commented on your post.' 
    });

    res.status(200).json({ success: true, message: 'Comment posted', post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 5. DELETE COMMENT
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.commentsData.find(c => c._id.toString() === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId.toString() !== userId && post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    post.commentsData = post.commentsData.filter(c => c._id.toString() !== commentId);
    await post.save();

    res.status(200).json({ success: true, message: 'Comment deleted', post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 6. EDIT COMMENT
exports.editComment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { postId, commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment empty' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.commentsData.find(c => c._id.toString() === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    comment.text = text.trim();
    await post.save();

    res.status(200).json({ success: true, message: 'Comment updated', post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 7. GET USER INFO
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

// 8. DELETE POST
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 9. UPDATE POST
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