const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// 1. Matches client.get('/chat/chats')
router.get('/chats', auth, chatController.getUserChats);

// 2. Matches client.get('/chat/users')
router.get('/users', auth, chatController.getChatUsers);

// 3. Matches client.post('/chat/send')
router.post('/send', auth, chatController.sendMessage);

// 4. Matches client.get('/chat/messages/:partnerId')
router.get('/messages/:partnerId', auth, chatController.getMessages);

// 5. Start a new chat (optional if handled by send)
router.post('/start', auth, chatController.startChat);

// 6. MANUALLY ACCEPT CHAT REQUEST
router.post('/accept', auth, chatController.acceptChatRequest);

module.exports = router;