const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticateToken = require('../middlewares/auth');

// POST /api/messages - 쪽지 보내기
router.post('/', authenticateToken, messageController.sendMessage);

// GET /api/messages/:messageId - 쪽지 세부내용
router.get(
  '/:messageId',
  authenticateToken,
  messageController.getMessageDetail,
);

module.exports = router;
