const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');

// 이미지 Cloudinary 업로드 헬퍼
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sumarket' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
};

// GET /api/posts - 게시글 목록 조회
exports.getPosts = async (req, res) => {
  const { keyword, college, department } = req.query;

  try {
    let query = `
      SELECT p.id AS postId, p.book_title AS bookTitle, p.subject, 
             p.college, p.department, p.trade_status AS tradeStatus,
             (SELECT image_url FROM images WHERE post_id = p.id ORDER BY order_num ASC LIMIT 1) AS thumbnailUrl
      FROM posts p
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      query += ` AND (p.book_title LIKE ? OR p.subject LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (college) {
      query += ` AND p.college = ?`;
      params.push(college);
    }
    if (department) {
      query += ` AND p.department = ?`;
      params.push(department);
    }

    query += ` ORDER BY p.id DESC`;

    const [posts] = await pool.query(query, params);
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// GET /api/posts/:postId - 게시글 상세 조회
exports.getPostDetail = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const [posts] = await pool.query(
      `SELECT p.*, u.nickname AS sellerName, u.college AS sellerCollege, u.department AS sellerDepartment
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [postId],
    );

    if (posts.length === 0)
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

    const post = posts[0];

    // 이미지 목록
    const [images] = await pool.query(
      'SELECT image_url AS imageUrl FROM images WHERE post_id = ? ORDER BY order_num ASC',
      [postId],
    );

    // 찜 여부
    const [wished] = await pool.query(
      'SELECT id FROM wishes WHERE user_id = ? AND post_id = ?',
      [userId, postId],
    );

    res.json({
      postId: post.id,
      bookTitle: post.book_title,
      bookAuthor: post.book_author,
      subject: post.subject,
      price: post.price,
      bookCondition: post.book_condition,
      tradeStatus: post.trade_status,
      college: post.college,
      department: post.department,
      description: post.description,
      images: images.map((img) => img.imageUrl),
      seller: {
        name: post.sellerName,
        college: post.sellerCollege,
        department: post.sellerDepartment,
      },
      isWished: wished.length > 0,
      isOwner: post.user_id === userId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// POST /api/posts - 게시글 등록
exports.createPost = async (req, res) => {
  const {
    bookTitle,
    bookAuthor,
    subject,
    price,
    bookCondition,
    college,
    department,
    description,
  } = req.body;
  const userId = req.user.id;

  if (
    !bookTitle ||
    !bookAuthor ||
    !subject ||
    !price ||
    !bookCondition ||
    !college ||
    !department
  ) {
    return res.status(400).json({ error: '필수 항목을 모두 입력해주세요.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO posts (user_id, book_title, book_author, subject, price, book_condition, college, department, description, trade_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '거래전')`,
      [
        userId,
        bookTitle,
        bookAuthor,
        subject,
        price,
        bookCondition,
        college,
        department,
        description || null,
      ],
    );

    const postId = result.insertId;

    // 이미지 업로드
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const uploaded = await uploadToCloudinary(req.files[i].buffer);
        await pool.query(
          'INSERT INTO images (post_id, image_url, public_id, order_num) VALUES (?, ?, ?, ?)',
          [postId, uploaded.secure_url, uploaded.public_id, i + 1],
        );
      }
    }

    res.status(201).json({ postId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// PUT /api/posts/:postId - 게시글 수정
exports.updatePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const {
    bookTitle,
    bookAuthor,
    subject,
    price,
    bookCondition,
    college,
    department,
    description,
    deleteImageIds,
  } = req.body;

  if (
    !bookTitle ||
    !bookAuthor ||
    !subject ||
    !price ||
    !bookCondition ||
    !college ||
    !department
  ) {
    return res.status(400).json({ error: '필수 항목을 모두 입력해주세요.' });
  }

  try {
    const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [
      postId,
    ]);
    if (posts.length === 0)
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    if (posts[0].user_id !== userId)
      return res.status(403).json({ error: '수정 권한이 없습니다.' });

    // 기존 이미지 삭제
    if (deleteImageIds && deleteImageIds.length > 0) {
      const ids = JSON.parse(deleteImageIds);
      for (const imageId of ids) {
        const [imgs] = await pool.query(
          'SELECT public_id FROM images WHERE id = ?',
          [imageId],
        );
        if (imgs.length > 0)
          await cloudinary.uploader.destroy(imgs[0].public_id);
        await pool.query('DELETE FROM images WHERE id = ?', [imageId]);
      }
    }

    // 새 이미지 업로드
    if (req.files && req.files.length > 0) {
      const [existingImgs] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM images WHERE post_id = ?',
        [postId],
      );
      const currentCount = existingImgs[0].cnt;

      if (currentCount + req.files.length > 5) {
        return res
          .status(400)
          .json({ error: '이미지는 최대 5장까지 등록 가능합니다.' });
      }

      for (let i = 0; i < req.files.length; i++) {
        const uploaded = await uploadToCloudinary(req.files[i].buffer);
        await pool.query(
          'INSERT INTO images (post_id, image_url, public_id, order_num) VALUES (?, ?, ?, ?)',
          [
            postId,
            uploaded.secure_url,
            uploaded.public_id,
            currentCount + i + 1,
          ],
        );
      }
    }

    await pool.query(
      `UPDATE posts SET book_title=?, book_author=?, subject=?, price=?, book_condition=?, college=?, department=?, description=?, updated_at=NOW()
       WHERE id=?`,
      [
        bookTitle,
        bookAuthor,
        subject,
        price,
        bookCondition,
        college,
        department,
        description || null,
        postId,
      ],
    );

    res.json({ message: '게시글이 수정되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// DELETE /api/posts/:postId - 게시글 삭제
exports.deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [
      postId,
    ]);
    if (posts.length === 0)
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    if (posts[0].user_id !== userId)
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });

    // Cloudinary 이미지 삭제
    const [images] = await pool.query(
      'SELECT public_id FROM images WHERE post_id = ?',
      [postId],
    );
    for (const img of images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ message: '게시글이 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// PATCH /api/posts/:postId/status - 거래 상태 변경
exports.updateStatus = async (req, res) => {
  const { postId } = req.params;
  const { tradeStatus } = req.body;
  const userId = req.user.id;

  const validStatuses = ['거래전', '거래중', '거래완료'];
  if (!validStatuses.includes(tradeStatus)) {
    return res.status(400).json({ error: '유효하지 않은 거래 상태입니다.' });
  }

  try {
    const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [
      postId,
    ]);
    if (posts.length === 0)
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    if (posts[0].user_id !== userId)
      return res.status(403).json({ error: '변경 권한이 없습니다.' });

    await pool.query(
      'UPDATE posts SET trade_status = ?, updated_at = NOW() WHERE id = ?',
      [tradeStatus, postId],
    );
    res.json({ message: '거래 상태가 변경되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// POST /api/posts/:postId/wish - 찜 추가
exports.addWish = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const [posts] = await pool.query('SELECT id FROM posts WHERE id = ?', [
      postId,
    ]);
    if (posts.length === 0)
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

    await pool.query(
      'INSERT IGNORE INTO wishes (user_id, post_id) VALUES (?, ?)',
      [userId, postId],
    );
    res.json({ message: '찜 목록에 추가되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// DELETE /api/posts/:postId/wish - 찜 해제
exports.removeWish = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    await pool.query('DELETE FROM wishes WHERE user_id = ? AND post_id = ?', [
      userId,
      postId,
    ]);
    res.json({ message: '찜 목록에서 제거되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
