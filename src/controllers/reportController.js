const pool = require('../config/db');

const VALID_REASONS = [
  '사기 의심',
  '불량/허위 정보',
  '욕설/비방',
  '도배/광고',
  '기타',
];

// POST /api/posts/:postId/report - 게시글 신고
exports.reportPost = async (req, res) => {
  const { postId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  if (!reason || !VALID_REASONS.includes(reason)) {
    return res.status(400).json({ error: '올바른 신고 사유를 선택해주세요.' });
  }

  try {
    // 게시글 존재 여부 확인
    const [posts] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [
      postId,
    ]);
    if (posts.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // 본인 게시글 신고 불가
    if (posts[0].user_id === userId) {
      return res
        .status(400)
        .json({ error: '본인 게시글은 신고할 수 없습니다.' });
    }

    // 중복 신고 방지
    const [existing] = await pool.query(
      'SELECT id FROM reports WHERE post_id = ? AND reporter_id = ?',
      [postId, userId],
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: '이미 신고한 게시글입니다.' });
    }

    await pool.query(
      'INSERT INTO reports (post_id, reporter_id, reason) VALUES (?, ?, ?)',
      [postId, userId, reason],
    );

    res.json({ message: '신고가 접수되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
