const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// DB 연결 테스트
pool
  .getConnection()
  .then((conn) => {
    console.log('DB 연결 성공!');
    conn.release();
  })
  .catch((err) => {
    console.error('DB 연결 실패:', err.message);
  });

// 라우트 연결
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

const postRoutes = require('./src/routes/posts');
app.use('/api/posts', postRoutes);

const mypageRoutes = require('./src/routes/mypage');
app.use('/api/my', mypageRoutes);

const collegeRoutes = require('./src/routes/colleges');
app.use('/api/codes/colleges', collegeRoutes);

const messageRoutes = require('./src/routes/messages');
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.json({ message: '수마켓 API 서버가 정상 작동 중입니다!' });
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
