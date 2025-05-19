import express from 'express';
import db from '../config/db.js';
import { sendCheckoutConfirmation } from '../Services/emailService.js';

const router = express.Router();

// Helper function to validate property type
const isValidPropertyType = (type) => ['villa', 'room'].includes(type);

// =========== PENDING BOOKINGS =============
/**
 * Get all pending bookings for front desk user's assigned villa (both villa and room bookings)
 */
router.get('/api/frontdesk/pending', async (req, res) => {
  try {
    const { villaId } = req.query;
    
    if (!villaId) {
      return res.status(400).json({
        success: false,
        message: 'Villa ID is required as query parameter'
      });
    }

    // First get the villa location
    const [villa] = await db.promise().query(
      'SELECT villaLocation FROM villas WHERE id = ?',
      [villaId]
    );

    if (villa.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Villa not found'
      });
    }

    const villaLocation = villa[0].villaLocation;

    // Get all pending bookings for this villa
    const [bookings] = await db.promise().query(`
      SELECT 
        b.id,
        b.guest_name,
        b.contact_number,
        b.check_in_date,
        b.check_out_date,
        b.propertyType,
        b.propertyId,
        b.status,
        CASE 
          WHEN b.propertyType = 'villa' THEN v.villaLocation
          WHEN b.propertyType = 'room' THEN CONCAT('Room #', r.id, ' - ', r.villaLocation)
        END AS propertyName
      FROM bookings b
      LEFT JOIN villas v ON b.propertyType = 'villa' AND b.propertyId = v.id
      LEFT JOIN rooms r ON b.propertyType = 'room' AND b.propertyId = r.id
      WHERE b.status = 'pending'
      AND (
        (b.propertyType = 'villa' AND b.propertyId = ?) OR
        (b.propertyType = 'room' AND r.villaLocation = ?)
      )
      ORDER BY b.check_in_date ASC
    `, [villaId, villaLocation]);

    res.json({
      success: true,
      data: bookings.map(booking => ({
        ...booking,
        check_in_date: new Date(booking.check_in_date).toISOString(),
        check_out_date: new Date(booking.check_out_date).toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pending bookings'
    });
  }
});

/**
 * Process a pending booking (check-in or cancel)
 * Expects propertyId and propertyType in request body
 */
router.put('/api/frontdesk/pending/:id', async (req, res) => {
  const { id } = req.params;
  const { action, propertyId, propertyType } = req.body;

  if (!propertyId || !propertyType) {
    return res.status(403).json({
      success: false,
      message: 'Property ID and Property Type are required in the request body'
    });
  }

  if (!isValidPropertyType(propertyType)) {
    return res.status(400).json({
      success: false,
      message: 'Property Type must be either "villa" or "room"'
    });
  }

  if (!['checkin', 'cancel'].includes(action)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid action. Must be "checkin" or "cancel"' 
    });
  }

  try {
    // Verify the booking exists, is pending, and belongs to the user's property
    let query = `
      SELECT id FROM bookings 
      WHERE id = ? 
      AND status = "pending"
      AND propertyType = ?
      AND propertyId = ?
    `;

    // If propertyType is villa, also check if it's a room in that villa
    if (propertyType === 'villa') {
      query = `
        SELECT b.id FROM bookings b
        LEFT JOIN rooms r ON b.propertyId = r.id AND b.propertyType = 'room'
        WHERE b.id = ?
        AND b.status = "pending"
        AND (
          (b.propertyType = 'villa' AND b.propertyId = ?) OR
          (b.propertyType = 'room' AND r.villaLocation = ?)
        )
      `;
    }

    const queryParams = propertyType === 'villa' ? [id, propertyId, propertyId] : [id, propertyType, propertyId];
    
    const [booking] = await db.promise().query(query, queryParams);

    if (booking.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found, already processed, or not assigned to your property' 
      });
    }

    // Update the booking status
    const newStatus = action === 'checkin' ? 'check-in' : 'cancelled';
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // If cancelling, set cancelled_date
    const updateQuery = action === 'cancel' 
      ? 'UPDATE bookings SET status = ?, cancelled_date = ? WHERE id = ?'
      : 'UPDATE bookings SET status = ? WHERE id = ?';
    
    const updateParams = action === 'cancel'
      ? [newStatus, timestamp, id]
      : [newStatus, id];
    
    await db.promise().query(updateQuery, updateParams);

    res.json({ 
      success: true,
      message: `Booking ${newStatus} successfully` 
    });
  } catch (error) {
    console.error(`Error ${action} booking:`, error);
    res.status(500).json({ 
      success: false,
      error: `Failed to ${action} booking` 
    });
  }
});

// =========== CHECK-IN BOOKINGS =============
/**
 * Get all checked-in bookings for front desk user's assigned properties
 * Expects propertyId and propertyType as query parameters
 */
router.get('/api/frontdesk/checkin', async (req, res) => {
  try {
    const { villaId } = req.query;
    
    if (!villaId) {
      return res.status(400).json({
        success: false,
        message: 'Villa ID is required as query parameter'
      });
    }

    // Get villa location first
    const [villa] = await db.promise().query(
      'SELECT villaLocation FROM villas WHERE id = ?',
      [villaId]
    );

    if (villa.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Villa not found'
      });
    }

    const villaLocation = villa[0].villaLocation;

    // Get all check-in bookings
    const [results] = await db.promise().query(`
      SELECT 
        b.id AS _id,
        b.guest_name ,
        b.propertyType AS category,
        b.check_in_date AS checkInDate,
        b.check_out_date AS checkOutDate,
        b.status,
        b.total_amount AS totalAmount,
        b.amount_paid AS amountPaid,
        (b.total_amount - IFNULL(b.amount_paid, 0)) AS balanceDue,
        b.payment_status AS paymentStatus,
        CASE 
          WHEN b.propertyType = 'villa' THEN v.villaLocation
          WHEN b.propertyType = 'room' THEN CONCAT('Room #', r.id, ' - ', r.villaLocation)
        END AS propertyName
      FROM bookings b
      LEFT JOIN villas v ON b.propertyType = 'villa' AND b.propertyId = v.id
      LEFT JOIN rooms r ON b.propertyType = 'room' AND b.propertyId = r.id
      WHERE b.status = 'check-in'
      AND (
        (b.propertyType = 'villa' AND b.propertyId = ?) OR
        (b.propertyType = 'room' AND r.villaLocation = ?)
      )
    `, [villaId, villaLocation]);
    
    // Format results
    const formattedResults = results.map(booking => ({
      ...booking,
      checkInDate: new Date(booking.checkInDate).toISOString(),
      checkOutDate: new Date(booking.checkOutDate).toISOString(),
      totalAmount: parseFloat(booking.totalAmount) || 0,
      amountPaid: parseFloat(booking.amountPaid) || 0,
      balanceDue: Math.max(0, parseFloat(booking.balanceDue) || 0),
      paymentStatus: booking.paymentStatus || 'unpaid'
    }));
    
    res.json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch check-ins' 
    });
  }
});

/**
 * Process check-out for a checked-in booking
 * Expects propertyId and propertyType in request body
 */
router.put('/api/frontdesk/checkin/:id', async (req, res) => {
  const { id } = req.params;
  const { action, propertyId, propertyType } = req.body;

  if (!propertyId || !propertyType) {
    return res.status(403).json({
      success: false,
      message: 'Property ID and Property Type are required in the request body'
    });
  }

  if (!isValidPropertyType(propertyType)) {
    return res.status(400).json({
      success: false,
      message: 'Property Type must be either "villa" or "room"'
    });
  }

  if (action !== 'checkout') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid action. Must be "checkout"' 
    });
  }

  try {
    // 1. First check if booking exists and belongs to user's property
    let query = `
      SELECT * FROM bookings 
      WHERE id = ? 
      AND status = "check-in"
      AND propertyType = ?
      AND propertyId = ?
    `;

    // If propertyType is villa, also check if it's a room in that villa
    if (propertyType === 'villa') {
      query = `
        SELECT b.* FROM bookings b
        LEFT JOIN rooms r ON b.propertyId = r.id AND b.propertyType = 'room'
        WHERE b.id = ?
        AND b.status = "check-in"
        AND (
          (b.propertyType = 'villa' AND b.propertyId = ?) OR
          (b.propertyType = 'room' AND r.villaLocation = ?)
        )
      `;
    }

    const queryParams = propertyType === 'villa' ? [id, propertyId, propertyId] : [id, propertyType, propertyId];
    const [checkinBookings] = await db.promise().query(query, queryParams);

    if (checkinBookings.length === 0) {
      // Get the actual status if booking exists but not in check-in status
      const [anyBooking] = await db.promise().query(
        'SELECT status FROM bookings WHERE id = ?',
        [id]
      );
      
      if (anyBooking.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: `No booking exists with ID ${id}` 
        });
      } else {
        return res.status(400).json({
          success: false,
          error: `Booking found but status is ${anyBooking[0].status}. Must be 'check-in' to checkout`,
          currentStatus: anyBooking[0].status
        });
      }
    }

    const bookingData = checkinBookings[0];
    
    // 2. Verify payment (ensure sufficient payment has been made)
    const totalAmount = parseFloat(bookingData.total_amount) || 0;
    const amountPaid = parseFloat(bookingData.amount_paid) || 0;
    const depositRequired = totalAmount * 0.3; // 30% deposit requirement
    const balanceDue = depositRequired - amountPaid;

    if (balanceDue > 0) {
      return res.status(400).json({ 
        success: false,
        error: '30% deposit requirement not met',
        requiredDeposit: depositRequired,
        amountPaid: amountPaid,
        balanceDue: balanceDue
      });
    }

    // 3. Process checkout
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.promise().query(`
      UPDATE bookings 
      SET status = 'check-out', 
          payment_status = 'fully_paid',
          amount_paid = total_amount,
          checkout_date = ?
      WHERE id = ?`,
      [timestamp, id]
    );

    // 4. Send email confirmation
    try {
      await sendCheckoutConfirmation(id);
    } catch (emailError) {
      console.error(`Email error for booking ${id}:`, emailError);
      // Continue even if email fails (don't fail the checkout)
    }

    res.json({ 
      success: true,
      message: 'Checkout processed successfully'
    });

  } catch (error) {
    console.error('Checkout processing error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during checkout',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =========== CHECK-OUT BOOKINGS =============
/**
 * Get all checked-out bookings for front desk user's assigned villa (both villa and room bookings)
 */
router.get('/api/frontdesk/checkout', async (req, res) => {
  try {
    const { villaId } = req.query;
    
    if (!villaId) {
      return res.status(400).json({
        success: false,
        message: 'Villa ID is required as query parameter'
      });
    }

    // Get villa location first
    const [villa] = await db.promise().query(
      'SELECT villaLocation FROM villas WHERE id = ?',
      [villaId]
    );

    if (villa.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Villa not found'
      });
    }

    const villaLocation = villa[0].villaLocation;

    // Get all checked-out bookings
    const [bookings] = await db.promise().query(`
      SELECT 
        b.id AS _id,
        b.guest_name,
         b.contact_number,
        b.propertyType,
        b.propertyId,
        b.check_in_date AS checkInDate,
        b.check_out_date AS checkOutDate,
        b.status,
        b.total_amount AS totalAmount,
        b.amount_paid AS amountPaid,
        b.payment_status AS paymentStatus,
        CASE 
          WHEN b.propertyType = 'villa' THEN v.villaLocation
          WHEN b.propertyType = 'room' THEN CONCAT('Room #', r.id, ' - ', r.villaLocation)
        END AS propertyName
      FROM bookings b
      LEFT JOIN villas v ON b.propertyType = 'villa' AND b.propertyId = v.id
      LEFT JOIN rooms r ON b.propertyType = 'room' AND b.propertyId = r.id
      WHERE (b.status = 'check-out' OR b.status = 'completed')
      AND (
        (b.propertyType = 'villa' AND b.propertyId = ?) OR
        (b.propertyType = 'room' AND r.villaLocation = ?)
      )
      ORDER BY b.check_out_date DESC
    `, [villaId, villaLocation]);

    // Format results
    const formattedResults = bookings.map(booking => ({
      ...booking,
      checkInDate: new Date(booking.checkInDate).toISOString(),
      checkOutDate: new Date(booking.checkOutDate).toISOString(),
      totalAmount: parseFloat(booking.totalAmount) || 0,
      amountPaid: parseFloat(booking.amountPaid) || 0,
      paymentStatus: booking.paymentStatus || 'unpaid'
    }));
    
    res.json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error('Error fetching check-outs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch check-outs' 
    });
  }
});

// =========== CANCELLED BOOKINGS =============
/**
 * Get all cancelled bookings for front desk user's assigned properties
 * Expects propertyId and propertyType as query parameters
 */
router.get('/api/frontdesk/cancellation', async (req, res) => {
  try {
    const { villaId } = req.query;
    
    if (!villaId) {
      return res.status(400).json({
        success: false,
        message: 'Villa ID is required as query parameter'
      });
    }

    // Get villa location first
    const [villa] = await db.promise().query(
      'SELECT villaLocation FROM villas WHERE id = ?',
      [villaId]
    );

    if (villa.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Villa not found'
      });
    }

    const villaLocation = villa[0].villaLocation;

    // Get all cancelled bookings
    const [results] = await db.promise().query(`
      SELECT 
        b.id,
        b.guest_name AS customerName,
        b.contact_number AS contactNumber,
        b.check_in_date AS reservedDate,
        b.cancelled_date AS cancellationDate,
        b.propertyType AS category,
        b.status
      FROM bookings b
      LEFT JOIN villas v ON b.propertyType = 'villa' AND b.propertyId = v.id
      LEFT JOIN rooms r ON b.propertyType = 'room' AND b.propertyId = r.id
      WHERE b.status = 'cancelled'
      AND (
        (b.propertyType = 'villa' AND b.propertyId = ?) OR
        (b.propertyType = 'room' AND r.villaLocation = ?)
      )
    `, [villaId, villaLocation]);
    
    // Format results
    const formattedResults = results.map(booking => ({
      ...booking,
      reservedDate: booking.reservedDate ? new Date(booking.reservedDate).toISOString() : null,
      cancellationDate: booking.cancellationDate ? new Date(booking.cancellationDate).toISOString() : null,
      status: 'cancelled'
    }));
    
    res.json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error('Error fetching cancellations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch cancelled bookings'
    });
  }
});

export default router;
