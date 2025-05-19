import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Get all bookings for admin management
router.get('/api/adminbookingmanagement', async (req, res) => {
  try {
    const [results] = await db.promise().query(`
       SELECT 
        b.id,
        b.guest_name AS customer_name,
        COALESCE(v.villaLocation, r.villaLocation) AS villa_location,
        DATE_FORMAT(b.check_in_date, '%Y-%m-%d') AS check_in_date,
        DATE_FORMAT(b.check_out_date, '%Y-%m-%d') AS check_out_date,
        b.propertyType AS category,
        b.total_amount AS amount,
        b.status,
        b.payment_status
      FROM bookings b
      LEFT JOIN villas v ON b.propertyId = v.id AND b.propertyType = 'villa'
      LEFT JOIN rooms r ON b.propertyId = r.id AND b.propertyType = 'room'
      ORDER BY b.check_in_date DESC;
    `);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch bookings' 
    });
  }
});

// Update booking status
router.put('/api/adminbookingmanagement/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate allowed status values
  const allowedStatuses = ['pending', 'check-in', 'check-out', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid status value' 
    });
  }

  try {
    await db.promise().query(
      `UPDATE bookings SET status = ? WHERE id = ?`,
      [status, id]
    );
    
    res.json({ 
      success: true,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update booking status' 
    });
  }
});

export default router;