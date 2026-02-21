import client from './client';

/**
 * Frontend actions for interacting with notification backend routes.
 * These routes are protected and require the crayai_token.
 */
const notificationActions = {
  // GET /api/notification - Fetch all notifications for the logged-in user
  getNotifications: async () => {
    return await client.get('/notification');
  },

  // GET /api/notification/unread-count - Fetch total unread notifications
  getUnreadCount: async () => {
    return await client.get('/notification/unread-count');
  },

  // PUT /api/notification/read-all - Mark all as read
  markAllRead: async () => {
    return await client.put('/notification/read-all');
  },

  // PUT /api/notification/:id/read - Mark one specific notification as read
  markOneRead: async (id) => {
    return await client.put(`/notification/${id}/read`);
  }
};

export default notificationActions;