const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/chatController');
const { protect, requireVerified } = require('../middleware/authMiddleware');

router.post('/conversation', protect, requireVerified, startOrGetConversation);
router.get('/conversations', protect, getUserConversations);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages', protect, requireVerified, sendMessage);
router.put('/messages/read/:conversationId', protect, markMessagesRead);
router.get('/unread-counts', protect, getUnreadCounts);

// Global Campus Chat & Online Stats
router.get('/global/messages', protect, getGlobalMessages);
router.post('/global/messages', protect, requireVerified, sendGlobalMessage);
router.put('/global/read', protect, markGlobalRead);
router.post('/global/reset', protect, requireVerified, resetGlobalMessages);
router.get('/online-stats', protect, getOnlineStats);

module.exports = router;
