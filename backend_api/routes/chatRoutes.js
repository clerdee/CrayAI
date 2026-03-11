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
router.delete('/message/:partnerId/:messageId', auth, chatController.deleteMessage);
router.delete('/conversation/:partnerId', auth, chatController.deleteConversation);

module.exports = router;