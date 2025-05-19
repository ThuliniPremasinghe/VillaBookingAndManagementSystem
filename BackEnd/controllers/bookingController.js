import db from '../config/db.js';


// Enhanced getAvailability function
const getAvailability = async (req, res) => {
  const { propertyType, checkInDate, checkOutDate, adults, children } = req.query;
  const totalGuests = parseInt(adults || 0) + parseInt(children || 0);

  try {
    // Validate input
    if (!propertyType || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: propertyType, checkInDate, checkOutDate"
      });
    }

    // Check date validity
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date"
      });
    }

    // Get all properties of this type that meet capacity requirements
    let propertiesQuery = `
      SELECT p.id, p.capacity
      FROM ${propertyType === 'villa' ? 'villas' : 'rooms'} p
      WHERE p.capacity >= ?
    `;
    
    const [properties] = await db.promise().query(propertiesQuery, [totalGuests]);

    // Get bookings that conflict with these dates
    const [conflictingBookings] = await db.promise().query(
      `SELECT DISTINCT propertyId 
       FROM bookings 
       WHERE propertyType = ? 
       AND (
         (check_in_date < ? AND check_out_date > ?) OR
         (check_in_date >= ? AND check_in_date < ?) OR
         (check_out_date > ? AND check_out_date <= ?)
       )
       AND status NOT IN ('check-out', 'cancelled')`,
      [
        propertyType,
        checkOutDate, checkInDate,
        checkInDate, checkOutDate,
        checkInDate, checkOutDate
      ]
    );

    // Filter out unavailable properties
    const conflictingIds = conflictingBookings.map(b => b.propertyId);
    const availableProperties = properties
      .filter(p => !conflictingIds.includes(p.id))
      .map(p => p.id);

    res.json({
      success: true,
      availableProperties,
      totalResults: availableProperties.length
    });
  } catch (error) {
    console.error("Error in getAvailability:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

// Enhanced getBookedDates function
const getBookedDates = async (req, res) => {
  const { id } = req.params;
  const propertyType = req.baseUrl.includes('villabookingform') ? 'villa' : 'room';

  try {
    const query = `
      SELECT check_in_date, check_out_date 
      FROM bookings 
      WHERE propertyType = ? 
      AND propertyId = ?
      AND status NOT IN ('check-out', 'cancelled')
    `;
    
    const [results] = await db.promise().query(query, [propertyType, id]);

    res.json({ 
      success: true, 
      bookedDates: results.map(item => ({
        check_in_date: item.check_in_date,
        check_out_date: item.check_out_date
      }))
    });
  } catch (error) {
    console.error("Error in getBookedDates:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};


// Common function to create booking
const createBooking = async (req, res) => {

  if (req.body.status && req.body.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'New bookings must be created with pending status'
    });
  }
  console.log('Incoming booking data:', req.body);

  // Validate required fields
  const requiredFields = [
    'fullName', 'email', 'contactNumber', 'nic',
    'checkInDate', 'checkOutDate', 'villaId', 'propertyType',
    'totalCost', 'depositAmount'
  ];
  
  const missingFields = requiredFields.filter(field => !req.body[field]);
  if (missingFields.length > 0) {
    console.error('Missing fields:', missingFields);
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  try {
    // Convert dates to MySQL format
    const checkIn = new Date(req.body.checkInDate).toISOString().slice(0, 19).replace('T', ' ');
    const checkOut = new Date(req.body.checkOutDate).toISOString().slice(0, 19).replace('T', ' ');

    const query = `
      INSERT INTO bookings (
        guest_name, email, contact_number, nic,
        propertyType, propertyId,
        check_in_date, check_out_date,
        total_amount, deposit_amount,
        special_requests, meal_plan, transportation,
        status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')
    `;

    const values = [
      req.body.fullName,
      req.body.email,
      req.body.contactNumber,
      req.body.nic,
      req.body.propertyType,
      req.body.villaId,
      checkIn,
      checkOut,
      parseFloat(req.body.totalCost),
      parseFloat(req.body.depositAmount),
      req.body.specialRequest || null,
      req.body.mealPlan || null,
      req.body.transportation || null
    ];

    console.log('Executing query:', query);
    console.log('With values:', values);

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('MySQL Error:', err);
        console.error('SQL Message:', err.sqlMessage);
        return res.status(500).json({
          success: false,
          message: 'Database operation failed',
          sqlError: err.message,
          errorCode: err.code,
          sqlState: err.sqlState
        });
      }

      console.log('Booking created with ID:', result.insertId);
      return res.json({
        success: true,
        bookingId: result.insertId,
        totalCost: req.body.totalCost
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: error.stack
    });
  }
};


const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    // Verify booking exists and get property info
    const [booking] = await db.promise().query(
      `SELECT id, propertyType, propertyId, check_in_date, check_out_date 
       FROM bookings WHERE id = ?`,
      [id]
    );

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Update booking status to cancelled
    await db.promise().query(
      `UPDATE bookings 
       SET status = 'cancelled',
           cancelled_date = NOW(),
           cancellation_reason = ?,
           payment_status = 'refunded'
       WHERE id = ?`,
      [reason || 'No reason provided', id]
    );

    // Return all necessary info for frontend to refresh
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      propertyType: booking[0].propertyType,
      propertyId: booking[0].propertyId,
      dates: {
        checkIn: formatDate(booking[0].check_in_date),
        checkOut: formatDate(booking[0].check_out_date)
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking'
    });
  }
};

const checkOutBooking = async (req, res) => {
  const { id } = req.params;

  try {
    // Verify booking exists and get property info
    const [booking] = await db.promise().query(
      `SELECT id, propertyType, propertyId, check_in_date, check_out_date 
       FROM bookings WHERE id = ?`,
      [id]
    );

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Update booking status to check-out
    await db.promise().query(
      `UPDATE bookings 
       SET status = 'check-out',
           actual_check_out_date = NOW()
       WHERE id = ?`,
      [id]
    );

    // Return all necessary info for frontend to refresh
    res.json({
      success: true,
      message: 'Check-out processed successfully',
      propertyType: booking[0].propertyType,
      propertyId: booking[0].propertyId,
      dates: {
        checkIn: formatDate(booking[0].check_in_date),
        checkOut: formatDate(booking[0].check_out_date)
      }
    });
  } catch (error) {
    console.error('Error during check-out:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process check-out'
    });
  }
};
export { createBooking, getBookedDates,cancelBooking,getAvailability,checkOutBooking };