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
} = require('../controllers/chatController');
const { protect, requireVerified } = require('../middleware/authMiddleware');

router.post('/conversation', protect, requireVerified, startOrGetConversation);
router.get('/conversations', protect, getUserConversations);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages', protect, requireVerified, sendMessage);

// Global Campus Chat & Online Stats
router.get('/global/messages', protect, getGlobalMessages);
router.post('/global/messages', protect, requireVerified, sendGlobalMessage);
router.post('/global/reset', protect, requireVerified, resetGlobalMessages);
router.get('/online-stats', protect, getOnlineStats);

module.exports = router;
