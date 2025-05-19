import db from '../config/db.js';

export const getAdminDashboardData = async (req, res) => {
  try {
    // Get room counts by type
    const [villaResults, deluxeRoomResults, doubleRoomResults, familyRoomResults] = await Promise.all([
      queryAsync("SELECT COUNT(*) AS count FROM villas"),
      queryAsync("SELECT COUNT(*) AS count FROM rooms WHERE roomType = 'deluxe'"),
      queryAsync("SELECT COUNT(*) AS count FROM rooms WHERE roomType = 'double'"),
      queryAsync("SELECT COUNT(*) AS count FROM rooms WHERE roomType = 'family'")
    ]);

    // Get booking status counts
    const bookingStatus = await queryAsync(`
      SELECT 
        status AS name,
        COUNT(*) AS value
      FROM bookings
      WHERE status IN ('pending', 'check-in', 'check-out', 'cancelled')
      GROUP BY status
    `);

    // Get revenue breakdown by property type (Villas vs Rooms)
    const revenueBreakdown = await queryAsync(`
      SELECT 
        CASE 
          WHEN propertyType = 'Villa' THEN 'Villas'
          ELSE 'Rooms'
        END AS name,
        SUM(
          CASE 
            WHEN propertyType = 'Villa' THEN 
              v.pricePerDay * DATEDIFF(b.check_out_date, b.check_in_date)
            ELSE 
              r.pricePerDay * DATEDIFF(b.check_out_date, b.check_in_date)
          END
        ) AS value
      FROM bookings b
      LEFT JOIN villas v ON b.propertyId = v.id AND b.propertyType = 'Villa'
      LEFT JOIN rooms r ON b.propertyId = r.id AND b.propertyType != 'Villa'
      WHERE b.status != 'cancelled'
      GROUP BY CASE 
        WHEN propertyType = 'Villa' THEN 'Villas'
        ELSE 'Rooms'
      END
    `);

    // For booking trends query
    const bookingTrends = await queryAsync(`
      SELECT 
        DATE_FORMAT(MIN(check_in_date), '%b') AS month,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'check-in' THEN 1 ELSE 0 END) AS checkin,
        SUM(CASE WHEN status = 'check-out' THEN 1 ELSE 0 END) AS checkout,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
        DATE_FORMAT(check_in_date, '%Y-%m') AS month_group
      FROM bookings
      WHERE check_in_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month_group
      ORDER BY month_group ASC
      LIMIT 6
    `);
    
    // For revenue trends query
    const revenueTrends = await queryAsync(`
      SELECT 
        DATE_FORMAT(MIN(b.check_in_date), '%b') AS month,
        SUM(CASE WHEN b.propertyType = 'Villa' THEN 
          v.pricePerDay * DATEDIFF(b.check_out_date, b.check_in_date)
          ELSE 0 END) AS villas,
        SUM(CASE WHEN b.propertyType != 'Villa' THEN 
          r.pricePerDay * DATEDIFF(b.check_out_date, b.check_in_date)
          ELSE 0 END) AS rooms,
        DATE_FORMAT(b.check_in_date, '%Y-%m') AS month_group
      FROM bookings b
      LEFT JOIN villas v ON b.propertyId = v.id AND b.propertyType = 'Villa'
      LEFT JOIN rooms r ON b.propertyId = r.id AND b.propertyType != 'Villa'
      WHERE b.check_in_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND b.status != 'cancelled'
      GROUP BY month_group
      ORDER BY month_group ASC
      LIMIT 6
    `);

    // Prepare response data
    const responseData = {
      // Room counts for overview cards
      villas: villaResults[0]?.count || 0,
      deluxeRooms: deluxeRoomResults[0]?.count || 0,
      doubleRooms: doubleRoomResults[0]?.count || 0,
      familyRooms: familyRoomResults[0]?.count || 0,
      
      // Other data staying as villa vs rooms categories
      bookingStatus: bookingStatus.map(item => ({
        name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
        value: parseInt(item.value) || 0
      })),
      revenueBreakdown: revenueBreakdown.map(item => ({
        name: item.name,
        value: parseFloat(item.value) || 0
      })),
      bookingTrends: bookingTrends.map(item => ({
        month: item.month,
        pending: parseInt(item.pending) || 0,
        checkin: parseInt(item.checkin) || 0,
        checkout: parseInt(item.checkout) || 0,
        cancelled: parseInt(item.cancelled) || 0
      })),
      revenueTrends: revenueTrends.map(item => ({
        month: item.month,
        villas: parseFloat(item.villas) || 0,
        rooms: parseFloat(item.rooms) || 0
      }))
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to convert callback-based db.query to promise-based
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}