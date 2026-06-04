const pool = require('../config/db');

// GET /api/my - 내 정보 조회
exports.getMyInfo = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT user_id AS userId, nickname, email, college, department FROM users WHERE id = ?',
      [userId],
    );

    if (rows.length === 0)
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// GET /api/my/posts - 내 판매 목록
exports.getMyPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    const [posts] = await pool.query(
      `SELECT p.id AS postId, p.book_title AS bookTitle, p.subject, 
              p.college, p.department, p.trade_status AS tradeStatus, p.price, 
              (SELECT image_url FROM images WHERE post_id = p.id ORDER BY order_num ASC LIMIT 1) AS thumbnailUrl
       FROM posts p
       WHERE p.user_id = ?
       ORDER BY p.id DESC`,
      [userId],
    );

    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// GET /api/my/wishes - 내 관심 목록
exports.getMyWishes = async (req, res) => {
  const userId = req.user.id;

  try {
    const [posts] = await pool.query(
      `SELECT p.id AS postId, p.book_title AS bookTitle, p.subject,
              p.college, p.department, p.trade_status AS tradeStatus, p.price,
              (SELECT image_url FROM images WHERE post_id = p.id ORDER BY order_num ASC LIMIT 1) AS thumbnailUrl
       FROM wishes w
       JOIN posts p ON w.post_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.id DESC`,
      [userId],
    );

    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
