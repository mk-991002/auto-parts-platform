const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/database');

// 라우트 import
const authRoutes = require('./routes/auth');
const compatibilityRoutes = require('./routes/compatibility');
const reservationRoutes = require('./routes/reservations');
const trackingRoutes = require('./routes/tracking');
const reviewRoutes = require('./routes/reviews');

dotenv.config();

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '✅ 서버가 정상 작동 중입니다!' });
});

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/reviews', reviewRoutes);

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('에러:', err);
  res.status(500).json({ error: err.message || '서버 오류 발생' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  🚀 자동차 정비 부품 플랫폼 서버 시작    ║');
  console.log(`║  http://localhost:${PORT}${' '.repeat(20 - String(PORT).length)}║`);
  console.log('║  상태: ✅ 정상 작동                       ║');
  console.log('╚════════════════════════════════════════════╝\n');
});

module.exports = app;
