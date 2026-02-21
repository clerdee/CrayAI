import client from './client';

const chatActions = {
  // GET /chats/chats
  getUserChats: async () => {
    return await client.get('/chats/chats');
  },

  // GET /chats/messages/:partnerId
  getMessages: async (partnerId) => {
    return await client.get(`/chats/messages/${partnerId}`);
  },

  // POST /chats/send
  sendMessage: async (receiverId, text) => {
    return await client.post('/chats/send', { receiverId, text });
  },

  // POST /chats/accept
  acceptChatRequest: async (chatId) => {
    return await client.post('/chats/accept', { chatId });
  }
};

export default chatActions;