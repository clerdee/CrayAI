const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.get('/chats', auth, chatController.getUserChats);
router.get('/users', auth, chatController.getChatUsers);
router.post('/send', auth, chatController.sendMessage);
router.get('/messages/:partnerId', auth, chatController.getMessages);
router.post('/start', auth, chatController.startChat);
router.post('/accept', auth, chatController.acceptChatRequest);

module.exports = router;