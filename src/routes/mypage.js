const express = require('express');
const router = express.Router();
const mypageController = require('../controllers/mypageController');
const messageController = require('../controllers/messageController');
const authenticateToken = require('../middlewares/auth');

// GET /api/my - 내 정보 조회
router.get('/', authenticateToken, mypageController.getMyInfo);

// GET /api/my/posts - 내 판매 목록
router.get('/posts', authenticateToken, mypageController.getMyPosts);

// GET /api/my/wishes - 내 관심 목록
router.get('/wishes', authenticateToken, mypageController.getMyWishes);

//쪽지
router.get(
  '/messages/sent',
  authenticateToken,
  messageController.getSentMessages,
);
router.get(
  '/messages/received',
  authenticateToken,
  messageController.getReceivedMessages,
);

module.exports = router;
