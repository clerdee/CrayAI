const express = require('express');
const router = express.Router();
const { 
  createPost, 
  getAllPosts, 
  toggleLike, 
  postComment, 
  deleteComment, 
  editComment, 
  getUserInfo,
  deletePost, 
  updatePost 
} = require('../controllers/postController');

const auth = require('../middleware/auth');

router.post('/create', auth, createPost);
router.get('/feed', getAllPosts);
router.post('/:postId/like', auth, toggleLike);
router.post('/:postId/comment', auth, postComment);
router.delete('/:postId/comment/:commentId', auth, deleteComment);
router.put('/:postId/comment/:commentId', auth, editComment);
router.get('/user/info', auth, getUserInfo);
router.delete('/:id', auth, deletePost); 
router.put('/:id', auth, updatePost);

module.exports = router;