const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticateToken = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const reportController = require('../controllers/reportController');

// GET /api/posts - 게시글 목록 조회 (검색/필터)
router.get('/', postController.getPosts);

// GET /api/posts/:postId - 게시글 상세 조회
router.get('/:postId', authenticateToken, postController.getPostDetail);

// POST /api/posts - 게시글 등록
router.post(
  '/',
  authenticateToken,
  upload.array('images', 5),
  postController.createPost,
);

// PUT /api/posts/:postId - 게시글 수정
router.put(
  '/:postId',
  authenticateToken,
  upload.array('images', 5),
  postController.updatePost,
);

// DELETE /api/posts/:postId - 게시글 삭제
router.delete('/:postId', authenticateToken, postController.deletePost);

// PATCH /api/posts/:postId/status - 거래 상태 변경
router.patch('/:postId/status', authenticateToken, postController.updateStatus);

// POST /api/posts/:postId/wish - 찜 추가
router.post('/:postId/wish', authenticateToken, postController.addWish);

// DELETE /api/posts/:postId/wish - 찜 해제
router.delete('/:postId/wish', authenticateToken, postController.removeWish);

router.post('/:postId/report', authenticateToken, reportController.reportPost);

module.exports = router;
