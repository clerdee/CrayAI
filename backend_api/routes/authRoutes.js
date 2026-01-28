const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, resendOTP, loginUser, getMe, authenticateToken, updateProfile, changePassword, updateEmail, getUserPublicProfile, followUser } = require('../controllers/authController'); 

router.post('/signup', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser); 
router.get('/profile', authenticateToken, getMe);
router.put('/profile/update', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.post('/update-email', authenticateToken, updateEmail);
router.get('/users/:id', authenticateToken, getUserPublicProfile);
router.post('/follow/:id', authenticateToken, followUser);

module.exports = router;