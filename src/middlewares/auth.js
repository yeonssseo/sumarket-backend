const jwt = require('jsonwebtoken');

// 로그인한 사용자인지 확인하는 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer 토큰값"

  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email } 등이 담김
    next();
  } catch (err) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = authenticateToken;
