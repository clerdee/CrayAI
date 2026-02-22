import client from './client';

const chatActions = {
  // GET /chat/chats
  getUserChats: async () => {
    return await client.get('/chat/chats');
  },

  // GET /chat/messages/:partnerId
  getMessages: async (partnerId) => {
    return await client.get(`/chat/messages/${partnerId}`);
  },

  // POST /chat/send
  sendMessage: async (receiverId, text, image) => {
    return await client.post('/chat/send', { receiverId, text, image });
  },

  // POST /chat/accept
  acceptChatRequest: async (chatId) => {
    return await client.post('/chat/accept', { chatId });
  },

  // POST /chat/decline (Added to match logic)
  declineChatRequest: async (chatId) => {
    return await client.post('/chat/decline', { chatId });
  }
};

export default chatActions;