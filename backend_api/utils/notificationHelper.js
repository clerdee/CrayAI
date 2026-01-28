const Notification = require('../models/Notification');

exports.createNotification = async ({ recipient, sender, type, postId, text, chatId }) => {
  try {
    // 1. Prevent Self-Notification
    // If a user likes their own post, we don't want to alert them.
    if (recipient.toString() === sender.toString()) {
      return;
    }

    // 2. Create the Notification Document
    await Notification.create({
      recipient,
      sender,
      type,      // 'like', 'comment', 'follow', 'message', 'request'
      postId,    // Optional: ID of the post involved
      chatId,    // Optional: ID of the chat involved
      text       // e.g. "liked your post."
    });

    console.log(`Notification sent to user ${recipient} from ${sender}`);

  } catch (error) {
    // We log the error but do NOT throw it. 
    // This ensures that if the notification system fails, the main action (like/comment) still succeeds.
    console.error("Notification creation failed:", error.message);
  }
};