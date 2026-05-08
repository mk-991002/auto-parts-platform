const express = require('express');
const pool = require('../config/database');
const auth = require('../middlewares/auth');

const router = express.Router();

// 리뷰 작성
router.post('/', auth, async (req, res) => {
  try {
    const { reservationId, rating, comment, recommended } = req.body;
    const customerId = req.user.id;

    if (!reservationId || !rating) {
      return res.status(400).json({ error: '예약 ID와 평점은 필수입니다' });
    }

    // 예약 정보 조회
    const reservationQuery = `
      SELECT r.*, p.shop_id FROM reservations r
      JOIN parts p ON r.part_id = p.id
      WHERE r.id = $1
    `;
    const reservationResult = await pool.query(reservationQuery, [reservationId]);

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }

    const shopId = reservationResult.rows[0].shop_id;

    // 리뷰 저장
    const reviewResult = await pool.query(
      `INSERT INTO reviews (reservation_id, customer_id, shop_id, rating, comment, recommended)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [reservationId, customerId, shopId, rating, comment || null, recommended !== false]
    );

    // 정비소 평점 자동 계산
    const ratingQuery = `
      SELECT 
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN recommended = true THEN 1 ELSE 0 END) as recommended_count
      FROM reviews
      WHERE shop_id = $1
    `;
    const ratingResult = await pool.query(ratingQuery, [shopId]);

    res.status(200).json({
      success: true,
      review: reviewResult.rows[0],
      shop_stats: {
        average_rating: parseFloat(ratingResult.rows[0].avg_rating).toFixed(2),
        total_reviews: ratingResult.rows[0].total_reviews,
        recommended_count: ratingResult.rows[0].recommended_count
      }
    });

  } catch (error) {
    console.error('리뷰 작성 에러:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 정비소별 평가 조회
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    const reviewsQuery = `
      SELECT 
        r.*,
        u.name as customer_name
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.shop_id = $1
      ORDER BY r.created_at DESC
    `;
    const reviewsResult = await pool.query(reviewsQuery, [shopId]);

    const statsQuery = `
      SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN recommended = true THEN 1 ELSE 0 END) as recommended_count
      FROM reviews
      WHERE shop_id = $1
    `;
    const statsResult = await pool.query(statsQuery, [shopId]);

    res.json({
      success: true,
      reviews: reviewsResult.rows,
      statistics: {
        average_rating: parseFloat(statsResult.rows[0].average_rating).toFixed(2),
        total_reviews: statsResult.rows[0].total_reviews,
        recommended_count: statsResult.rows[0].recommended_count
      }
    });

  } catch (error) {
    console.error('리뷰 조회 에러:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
