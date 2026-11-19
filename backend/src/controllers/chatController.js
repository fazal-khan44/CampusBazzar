const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const GlobalMessage = require('../models/GlobalMessage');

// @desc    Initiate or get existing conversation for a product
// @route   POST /api/chat/conversation
// @access  Private
const startOrGetConversation = async (req, res, next) => {
  try {
    const { sellerId, productId } = req.body;
    const buyerId = req.user._id;

    if (!sellerId || !productId) {
      return res.status(400).json({ message: 'sellerId and productId are required' });
    }

    if (sellerId.toString() === buyerId.toString()) {
      return res.status(400).json({ message: 'You cannot initiate a chat with yourself' });
    }

    // Look for existing conversation between these participants for this specific product
    let conversation = await Conversation.findOne({
      participants: { $all: [buyerId, sellerId] },
      product: productId,
    })
      .populate('participants', 'name email hostelName roomNumber avatar phoneNumber')
      .populate('product', 'title price images status hostelName roomNumber');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [buyerId, sellerId],
        product: productId,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email hostelName roomNumber avatar phoneNumber')
        .populate('product', 'title price images status hostelName roomNumber');
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for logged in user
// @route   GET /api/chat/conversations
// @access  Private
const getUserConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email hostelName roomNumber avatar phoneNumber')
      .populate('product', 'title price images status')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verify participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isMember = conversation.participants.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    // Mark messages not sent by current user as read
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    if (req.app.get('io')) {
      req.app.get('io').to(conversationId).emit('messages_read', {
        conversationId,
        readBy: req.user._id,
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({ message: 'conversationId and text are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text,
    });

    // Update conversation last message
    conversation.lastMessage = {
      text,
      sender: req.user._id,
      createdAt: new Date(),
    };
    await conversation.save();

    const populatedMsg = await Message.findById(message._id).populate(
      'sender',
      'name avatar'
    );

    // Socket.io emission if global io is available
    if (req.app.get('io')) {
      req.app.get('io').to(conversationId).emit('receive_message', populatedMsg);

      // Notify the other participant about new unread message
      const recipientId = conversation.participants.find(
        (id) => id.toString() !== req.user._id.toString()
      );
      if (recipientId) {
        const onlineUsers = req.app.get('onlineUsers') || new Map();
        const rid = recipientId.toString();
        if (onlineUsers.has(rid)) {
          onlineUsers.get(rid).forEach((sid) => {
            req.app.get('io').to(sid).emit('new_unread', { conversationId });
          });
        }
      }
    }

    res.status(201).json(populatedMsg);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all global campus messages (latest 100, auto-resets if >= 100)
// @route   GET /api/chat/global/messages
// @access  Private
const getGlobalMessages = async (req, res, next) => {
  try {
    const count = await GlobalMessage.countDocuments();
    if (count >= 100) {
      await GlobalMessage.deleteMany({});
      return res.json([]);
    }

    const messages = await GlobalMessage.find()
      .populate('sender', 'name avatar hostelName roomNumber collegeEmail isNitpStudent')
      .sort({ createdAt: -1 })
      .limit(100);

    // Mark unread global messages as read by current user
    await GlobalMessage.updateMany(
      {
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    // Return in chronological order
    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

// @desc    Send a global campus message (Resets/deletes DB messages when reaches 100)
// @route   POST /api/chat/global/messages
// @access  Private
const sendGlobalMessage = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const currentCount = await GlobalMessage.countDocuments();

    // If chat already has 100 or more messages, reset/delete all from DB first
    if (currentCount >= 100) {
      await GlobalMessage.deleteMany({});
      if (req.app.get('io')) {
        req.app.get('io').emit('global_chat_reset', {
          message: 'Global chat reached 100 messages and was automatically reset.',
        });
      }
    }

    const message = await GlobalMessage.create({
      sender: req.user._id,
      text: text.trim(),
    });

    const populatedMsg = await GlobalMessage.findById(message._id).populate(
      'sender',
      'name avatar hostelName roomNumber collegeEmail isNitpStudent'
    );

    const newCount = await GlobalMessage.countDocuments();
    let chatReset = false;

    // When chat reaches 100 messages, delete all messages from DB and reset
    if (newCount >= 100) {
      await GlobalMessage.deleteMany({});
      chatReset = true;
      if (req.app.get('io')) {
        req.app.get('io').emit('global_chat_reset', {
          message: 'Global chat reached 100 messages and was automatically reset.',
        });
      }
    }

    // Socket.io broadcast to all connected clients if not reset
    if (req.app.get('io') && !chatReset) {
      req.app.get('io').emit('receive_global_message', populatedMsg);
    }

    res.status(201).json({
      ...(populatedMsg ? populatedMsg.toObject() : {}),
      chatReset,
      totalCount: chatReset ? 0 : newCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually reset/clear global campus chat
// @route   POST /api/chat/global/reset
// @access  Private
const resetGlobalMessages = async (req, res, next) => {
  try {
    const result = await GlobalMessage.deleteMany({});
    if (req.app.get('io')) {
      req.app.get('io').emit('global_chat_reset', {
        message: 'Global chat has been reset.',
      });
    }
    res.json({
      success: true,
      message: 'Global chat reset successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active online users count and list
// @route   GET /api/chat/online-stats
// @access  Private
const getOnlineStats = async (req, res, next) => {
  try {
    const onlineUsersMap = req.app.get('onlineUsers') || new Map();
    const onlineUserIds = Array.from(onlineUsersMap.keys());
    res.json({
      onlineCount: onlineUserIds.length,
      onlineUserIds,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all messages in a conversation as read by current user
// @route   PUT /api/chat/messages/read/:conversationId
// @access  Private
const markMessagesRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const isMember = conversation.participants.some(
      (id) => id.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add userId to readBy for all messages not sent by this user
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );

    // Notify via socket that messages were read
    if (req.app.get('io')) {
      req.app.get('io').to(conversationId).emit('messages_read', {
        conversationId,
        readBy: userId,
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all global messages as read by current user
// @route   PUT /api/chat/global/read
// @access  Private
const markGlobalRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await GlobalMessage.updateMany(
      {
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread message counts per conversation for current user
// @route   GET /api/chat/unread-counts
// @access  Private
const getUnreadCounts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all conversations of this user
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const convIds = conversations.map((c) => c._id);

    // For each conversation, count messages not sent by user and not in readBy
    const counts = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: convIds },
          sender: { $ne: userId },
          readBy: { $ne: userId },
        },
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 },
        },
      },
    ]);

    // Build map { conversationId: count }
    const result = {};
    counts.forEach((c) => {
      result[c._id.toString()] = c.count;
    });

    // Count unread global messages
    const globalCount = await GlobalMessage.countDocuments({
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });

    res.json({
      conversations: result,
      global: globalCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startOrGetConversation,
  getUserConversations,
  getMessages,
  sendMessage,
  getGlobalMessages,
  sendGlobalMessage,
  resetGlobalMessages,
  getOnlineStats,
  markMessagesRead,
  markGlobalRead,
  getUnreadCounts,
};
