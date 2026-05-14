const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/codes/colleges - 단과대/학부 목록 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT college, department FROM colleges ORDER BY id ASC',
    );

    // 단과대별로 그룹핑
    const result = {};
    rows.forEach(({ college, department }) => {
      if (!result[college]) result[college] = [];
      result[college].push(department);
    });

    res.json({ colleges: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
