const Chat = require('../models/Chat');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// 1. START CHAT (Clicking Message Icon)
exports.startChat = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user ID is required' });
    }

    if (senderId === targetUserId) {
      return res.status(400).json({ message: 'Cannot start a chat with yourself' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [senderId, targetUserId] }
    });

    if (chat) {
      return res.status(200).json({ success: true, chat });
    }

    const [me, them] = await Promise.all([
      User.findById(senderId),
      User.findById(targetUserId)
    ]);

    if (!me || !them) {
      return res.status(404).json({ message: 'User not found' });
    }

    const myFollowing = (me.following || []).filter(id => id);
    const theirFollowing = (them.following || []).filter(id => id);

    const iFollowThem = myFollowing.some(id => id.toString() === targetUserId.toString());
    const theyFollowMe = theirFollowing.some(id => id.toString() === senderId.toString());

    let status = 'pending'; 
    
    if (iFollowThem && theyFollowMe) {
      status = 'accepted'; 
    } 

    chat = new Chat({
      participants: [senderId, targetUserId],
      initiator: senderId,
      status: status,
      messages: []
    });

    await chat.save();

    res.status(201).json({ success: true, chat });

  } catch (error) {
    console.error("Start Chat Error:", error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// 2. GET ALL CHATS (Raw List for Frontend Logic)
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'firstName lastName profilePic')
      .populate('messages.sender', '_id') 
      .sort({ lastMessageTime: -1 });

    res.status(200).json({ success: true, chats });
  } catch (error) {
    console.error("Get Chats Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 3. GET CHAT USERS (For Contact List Logic)
exports.getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);

    const followingIds = currentUser.following;
    const followerIds = currentUser.followers;
    
    const chats = await Chat.find({ participants: currentUserId });
    const chatPartnerIds = chats.map(c => 
      c.participants.find(p => p.toString() !== currentUserId)
    ).filter(id => id); 

    const allRelevantIds = [...new Set([...followingIds, ...followerIds, ...chatPartnerIds])];

    const users = await User.find({ _id: { $in: allRelevantIds } })
      .select('firstName lastName profilePic followers following');

    const formattedUsers = users.map(u => {
      const isFollowing = currentUser.following.includes(u._id);
      const isFollower = currentUser.followers.includes(u._id);
      
      return {
        _id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        profilePic: u.profilePic,
        isMutualFollow: isFollowing && isFollower, 
        isFollowRequest: !isFollowing && isFollower
      };
    });

    res.status(200).json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 4. SEND MESSAGE
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, text, image } = req.body;

    // Find chat
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
    }

    const newMessage = {
      sender: senderId,
      text: text || '',
      image: image || null,
      createdAt: new Date()
    };

    chat.messages.push(newMessage);
    chat.lastMessage = text || (image ? 'Sent an image' : '');
    chat.lastMessageTime = new Date();
    chat.unreadCount += 1;

    await chat.save();

    // Notification
    await createNotification({
        recipient: receiverId,
        sender: senderId,
        type: 'message',
        chatId: chat._id,
        text: 'sent you a message.'
    });

    res.status(200).json({ success: true, message: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 5. GET MESSAGES (History)
exports.getMessages = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findOne({
      participants: { $all: [userId, partnerId] }
    }).populate('messages.sender', 'firstName lastName profilePic');
    
    if (!chat) return res.status(200).json({ success: true, messages: [] });

    res.status(200).json({ success: true, messages: chat.messages });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// 6. MANUALLY ACCEPT CHAT REQUEST
exports.acceptChatRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!chat.participants.includes(userId) || chat.initiator.toString() === userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    chat.status = 'accepted';
    await chat.save();

    res.status(200).json({ success: true, message: 'Request accepted', chat });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// 7. DELETE OWN MESSAGE
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnerId, messageId } = req.params;

    const chat = await Chat.findOne({ participants: { $all: [userId, partnerId] } });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const messageDoc = chat.messages.id(messageId);
    if (!messageDoc) return res.status(404).json({ message: 'Message not found' });
    if (messageDoc.sender.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    messageDoc.deleteOne();

    const latestMessage = chat.messages[chat.messages.length - 1];
    chat.lastMessage = latestMessage ? (latestMessage.text || (latestMessage.image ? 'Sent an image' : '')) : '';
    chat.lastMessageTime = latestMessage ? latestMessage.createdAt : new Date();

    await chat.save();
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 8. DELETE CONVERSATION
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnerId } = req.params;

    const deleted = await Chat.findOneAndDelete({ participants: { $all: [userId, partnerId] } });
    if (!deleted) return res.status(404).json({ message: 'Chat not found' });

    res.status(200).json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete Conversation Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};