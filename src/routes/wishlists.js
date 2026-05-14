const express = require('express');
const router = express.Router();
// const wishlistController = require('../controllers/wishlistController');
// const authenticateToken = require('../middlewares/auth');

// GET /api/wishlists - 내 찜 목록
// router.get('/', authenticateToken, wishlistController.getWishlists);

// POST /api/wishlists/:bookId - 찜 추가
// router.post('/:bookId', authenticateToken, wishlistController.addWishlist);

// DELETE /api/wishlists/:bookId - 찜 삭제
// router.delete('/:bookId', authenticateToken, wishlistController.removeWishlist);

module.exports = router;
