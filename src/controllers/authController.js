const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendVerificationEmail } = require('../utils/email');

// 6자리 랜덤 인증 코드 생성
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/email/send - 인증 코드 발송
exports.sendCode = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: '이메일을 입력해주세요.' });
  if (!email.endsWith('@suwon.ac.kr')) {
    return res
      .status(400)
      .json({ error: '수원대학교 이메일(@suwon.ac.kr)만 사용 가능합니다.' });
  }

  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료

    // 기존 코드 삭제 후 새로 저장
    await pool.query('DELETE FROM email_codes WHERE email = ?', [email]);
    await pool.query(
      'INSERT INTO email_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt],
    );

    await sendVerificationEmail(email, code);
    res.json({ message: '인증 코드가 발송되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '이메일 발송에 실패했습니다.' });
  }
};

// POST /api/auth/email/verify - 인증 코드 확인 + verifyToken 발급
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code)
    return res
      .status(400)
      .json({ error: '이메일과 인증 코드를 입력해주세요.' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM email_codes WHERE email = ? AND code = ?',
      [email, code],
    );

    if (rows.length === 0)
      return res.status(400).json({ error: '인증 코드가 올바르지 않습니다.' });

    const record = rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return res.status(401).json({ error: '인증 코드가 만료되었습니다.' });
    }

    // 사용한 코드 삭제
    await pool.query('DELETE FROM email_codes WHERE email = ?', [email]);

    // verifyToken 발급 (10분 유효)
    const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '10m',
    });
    res.json({ verified: true, verifyToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// POST /api/auth/check-id - 아이디 중복 확인
exports.checkId = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: '아이디를 입력해주세요.' });

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE user_id = ?', [
      userId,
    ]);
    res.json({ available: rows.length === 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// POST /api/auth/signup - 회원가입
exports.signup = async (req, res) => {
  const {
    verifyToken,
    email,
    userId,
    nickname,
    password,
    college,
    department,
  } = req.body;

  if (
    !verifyToken ||
    !email ||
    !userId ||
    !nickname ||
    !password ||
    !college ||
    !department
  ) {
    return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
  }

  try {
    // verifyToken 검증
    let decoded;
    try {
      decoded = jwt.verify(verifyToken, process.env.JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({ error: '이메일 인증이 만료되었습니다. 다시 인증해주세요.' });
    }

    if (decoded.email !== email) {
      return res
        .status(400)
        .json({ error: '인증된 이메일과 일치하지 않습니다.' });
    }

    // 이메일/아이디 중복 확인
    const [emailCheck] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email],
    );
    if (emailCheck.length > 0)
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });

    const [idCheck] = await pool.query(
      'SELECT id FROM users WHERE user_id = ?',
      [userId],
    );
    if (idCheck.length > 0)
      return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (user_id, email, password, nickname, college, department, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [userId, email, hashedPassword, nickname, college, department],
    );

    res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// POST /api/auth/login - 로그인
exports.login = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password)
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [
      userId,
    ]);
    if (rows.length === 0)
      return res
        .status(401)
        .json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });

    // JWT 토큰 발급
    const token = jwt.sign(
      { id: user.id, userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        userId: user.user_id,
        nickname: user.nickname,
        college: user.college,
        department: user.department,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
