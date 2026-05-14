const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/email/send - 인증 코드 발송
router.post('/email/send', authController.sendCode);

// POST /api/auth/email/verify - 인증 코드 확인 + verifyToken 발급
router.post('/email/verify', authController.verifyCode);

// POST /api/auth/check-id - 아이디 중복 확인
router.post('/check-id', authController.checkId);

// POST /api/auth/signup - 회원가입
router.post('/signup', authController.signup);

// POST /api/auth/login - 로그인
router.post('/login', authController.login);

module.exports = router;
