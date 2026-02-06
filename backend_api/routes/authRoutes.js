const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, resendOTP, loginUser, getMe, 
        authenticateToken, updateProfile, changePassword, updateEmail, 
        getUserPublicProfile, followUser, getAllUsers, deleteUser, 
        socialLogin, getUserCount, updateUserStatus
      } = require('../controllers/authController'); 

const { getModerationContent, moderateContent } = require('../controllers/adminController');

router.post('/signup', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser); 
router.post('/social-login', socialLogin);
router.get('/profile', authenticateToken, getMe);
router.put('/profile/update', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.post('/update-email', authenticateToken, updateEmail);
router.get('/users/:id', authenticateToken, getUserPublicProfile);
router.post('/follow/:id', authenticateToken, followUser);
router.get('/user-count', getUserCount);

// --- ADMIN ROUTES ---
router.get('/admin/moderation', authenticateToken, getModerationContent);
router.put('/admin/moderation/:type/:id', authenticateToken, moderateContent);
router.delete('/admin/users/:id', authenticateToken, deleteUser);
router.put('/admin/users/:id/status', authenticateToken, updateUserStatus);
router.get('/admin/users', authenticateToken, getAllUsers);

module.exports = router;