import db from '../config/db.js';

export const verifyReviewToken = async (req, res) => {
  const { token, villaId } = req.query;
  
  if (!token) {
    return res.status(400).json({ 
      success: false, 
      message: 'Token is required' 
    });
  }
  
  try {
    // First verify the token exists and is valid
    const [tokenData] = await db.promise().query(
      `SELECT booking_id, expires FROM review_tokens 
       WHERE token = ? AND expires > NOW()`,
      [token]
    );

    if (!tokenData.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired review token' 
      });
    }

    const bookingId = tokenData[0].booking_id;

    // Then get booking and villa info separately
    const [bookingData] = await db.promise().query(
      `SELECT 
        b.id AS booking_id,
        b.user_id,
        b.guest_name,
        b.email AS guest_email,
        b.propertyId AS villa_id,
        v.villaLocation AS villaName
       FROM bookings b
       LEFT JOIN villas v ON b.propertyId = v.id
       WHERE b.id = ? ${villaId ? 'AND b.propertyId = ?' : ''}`,
      villaId ? [bookingId, villaId] : [bookingId]
    );

    if (!bookingData.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking not found or villa mismatch' 
      });
    }

    const booking = bookingData[0];
    
    res.status(200).json({ 
      success: true, 
      bookingInfo: {
        userName: booking.guest_name,
        villaName: booking.villaName
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const submitReview = async (req, res) => {
  const { token } = req.params;
  const reviewData = req.body;

  try {
    // 1. Verify token and get booking info with villa reference
    const [bookingData] = await db.promise().query(
      `SELECT 
        b.id AS booking_id,
        b.user_id,
        b.guest_name,
        b.email AS guest_email,
        CASE
          WHEN v.id IS NOT NULL THEN v.id
          WHEN r.villaLocation IS NOT NULL THEN (
            SELECT id FROM villas WHERE villaLocation = r.villaLocation LIMIT 1
          )
          ELSE NULL
        END AS villa_id,
        CASE
          WHEN v.id IS NOT NULL THEN v.villaLocation
          WHEN r.villaLocation IS NOT NULL THEN r.villaLocation
          ELSE NULL
        END AS villa_name
       FROM review_tokens rt
       JOIN bookings b ON rt.booking_id = b.id
       LEFT JOIN villas v ON b.propertyId = v.id
       LEFT JOIN rooms r ON b.propertyId = r.id
       WHERE rt.token = ? AND rt.expires > NOW()`,
      [token]
    );

    if (!bookingData.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired review token' 
      });
    }

    const booking = bookingData[0];

    // 2. Validate we found a villa reference
    if (!booking.villa_id) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine associated villa for this booking'
      });
    }

    // 3. Insert the villa review
    const [result] = await db.promise().query(
      `INSERT INTO reviews (
        villa_id, 
        booking_id,
        user_id,
        guest_name,
        guest_email,
        cleanliness,
        comfort,
        location,
        amenities,
        value_for_money,
        staff_service,
        comment,
        overall_rating,
        rating,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        booking.villa_id,
        booking.booking_id,
        booking.user_id,
        booking.guest_name,
        booking.guest_email,
        reviewData.cleanliness,
        reviewData.comfort,
        reviewData.location,
        reviewData.amenities,
        reviewData.valueForMoney,
        reviewData.staffService,
        reviewData.comment,
        reviewData.overallRating,
        reviewData.rating || reviewData.overallRating
      ]
    );

    // 4. Mark token as used
    await db.promise().query(
      `DELETE FROM review_tokens WHERE token = ?`,
      [token]
    );

    // 5. Return success response
    return res.status(201).json({ 
      success: true, 
      message: 'Villa review submitted successfully',
      reviewInfo: {
        reviewId: result.insertId,
        villaId: booking.villa_id,
        villaName: booking.villa_name,
        userName: booking.guest_name
      }
    });

  } catch (error) {
    console.error('Review submission failed:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to submit villa review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


  // Get all reviews with user and villa info
export const getAllReviews = async (req, res) => {
    try {
      const [reviews] = await db.promise().query(`
        SELECT 
          r.*,
          u.full_name AS user_name,
          (SELECT COUNT(*) FROM reviews WHERE user_id = r.user_id) AS user_total_reviews,
          v.villaLocation AS villa_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN villas v ON r.villa_id = v.id
        ORDER BY r.created_at DESC
      `);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  };
  
  // Get review statistics
  export const getReviewStats = async (req, res) => {
    try {
      // Total reviews count
      const [[total]] = await db.promise().query(
        `SELECT COUNT(*) AS total FROM reviews`
      );
  
      // Average rating
      const [[avg]] = await db.promise().query(
        `SELECT AVG(overall_rating) AS average FROM reviews`
      );
  
      // Yearly comparison
      const currentYear = new Date().getFullYear();
      const [[comparison]] = await db.promise().query(
        `SELECT 
          (COUNT(CASE WHEN YEAR(created_at) = ? THEN 1 END) - 
           COUNT(CASE WHEN YEAR(created_at) = ? THEN 1 END)) / 
           COUNT(CASE WHEN YEAR(created_at) = ? THEN 1 END) * 100 AS percent_change
         FROM reviews`,
        [currentYear, currentYear - 1, currentYear - 1]
      );
  
      res.status(200).json({
        totalReviews: total.total || 0,
        averageRating: avg.average || 0,
        yearlyComparison: comparison.percent_change || 0
      });
    } catch (error) {
      console.error('Error fetching review stats:', error);
      res.status(500).json({ message: 'Failed to fetch review stats' });
    }
  };