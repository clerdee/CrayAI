const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import Controllers
const { 
  createPost, 
  getAllPosts, 
  toggleLike, 
  getUserInfo,
  deletePost, 
  updatePost 
} = require('../controllers/postController');

const { 
  postComment, 
  deleteComment, 
  editComment 
} = require('../controllers/commentController');

// --- POST ROUTES ---
router.post('/create', auth, createPost);
router.get('/feed', getAllPosts);
router.post('/:postId/like', auth, toggleLike);
router.get('/user/info', auth, getUserInfo);
router.delete('/:id', auth, deletePost); 
router.put('/:id', auth, updatePost);

// --- COMMENT ROUTES ---
router.post('/:postId/comment', auth, postComment);
router.delete('/:postId/comment/:commentId', auth, deleteComment);
router.put('/:postId/comment/:commentId', auth, editComment);

module.exports = router;