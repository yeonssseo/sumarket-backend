const pool = require('../config/db');

// POST /api/messages - 쪽지 보내기
exports.sendMessage = async (req, res) => {
  const { postId, content } = req.body;
  const senderId = req.user.id;

  if (!postId || !content) {
    return res.status(400).json({ error: '게시글과 내용을 입력해주세요.' });
  }

  try {
    // 게시글 존재 여부 + 판매자 확인
    const [posts] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [
      postId,
    ]);
    if (posts.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    const receiverId = posts[0].user_id;

    // 본인 게시글엔 쪽지 불가
    if (receiverId === senderId) {
      return res
        .status(400)
        .json({ error: '본인 게시글에는 쪽지를 보낼 수 없습니다.' });
    }

    const [result] = await pool.query(
      'INSERT INTO messages (post_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      [postId, senderId, receiverId, content],
    );

    res.status(201).json({ messageId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// GET /api/my/messages/sent - 발신함
exports.getSentMessages = async (req, res) => {
  const userId = req.user.id;

  try {
    const [messages] = await pool.query(
      `SELECT m.id AS messageId, u.nickname AS toNickname,
              p.book_title AS bookTitle,
              LEFT(m.content, 30) AS content,
              DATE_FORMAT(m.created_at, '%y.%m.%d') AS createdAt
       FROM messages m
       JOIN users u ON m.receiver_id = u.id
       JOIN posts p ON m.post_id = p.id
       WHERE m.sender_id = ?
       ORDER BY m.id DESC`,
      [userId],
    );

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// GET /api/my/messages/received - 수신함
exports.getReceivedMessages = async (req, res) => {
  const userId = req.user.id;

  try {
    const [messages] = await pool.query(
      `SELECT m.id AS messageId, u.nickname AS fromNickname,
              p.book_title AS bookTitle,
              LEFT(m.content, 30) AS content,
              DATE_FORMAT(m.created_at, '%y.%m.%d') AS createdAt
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN posts p ON m.post_id = p.id
       WHERE m.receiver_id = ?
       ORDER BY m.id DESC`,
      [userId],
    );

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// GET /api/messages/:messageId - 쪽지 세부내용
exports.getMessageDetail = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const [messages] = await pool.query(
      `SELECT m.id AS messageId,
              s.nickname AS fromNickname,
              r.nickname AS toNickname,
              p.book_title AS bookTitle,
              m.post_id AS postId,
              m.content,
              DATE_FORMAT(m.created_at, '%y.%m.%d') AS createdAt
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       JOIN posts p ON m.post_id = p.id
       WHERE m.id = ?`,
      [messageId],
    );

    if (messages.length === 0) {
      return res.status(404).json({ error: '쪽지를 찾을 수 없습니다.' });
    }

    const message = messages[0];

    // 발신자 또는 수신자만 조회 가능
    const [rows] = await pool.query(
      'SELECT sender_id, receiver_id FROM messages WHERE id = ?',
      [messageId],
    );
    if (rows[0].sender_id !== userId && rows[0].receiver_id !== userId) {
      return res.status(403).json({ error: '조회 권한이 없습니다.' });
    }

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
