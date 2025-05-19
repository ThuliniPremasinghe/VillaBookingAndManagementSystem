import db from '../config/db.js';

export const getFrontDeskDashboardData = async (req, res) => {
  try {
    // Extract villa ID from query parameters or user's JWT
    const villaId = req.query.villaId || (req.user && req.user.villaId);
    
    let villaLocation = null;
    let params = [];
    
    // If villaId is provided, get its location first
    if (villaId) {
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
      
      villaLocation = villa[0].villaLocation;
      params = [villaId, villaLocation];
    }

    // Base conditions for villa and room bookings
    const villaCondition = villaId 
      ? 'WHERE (propertyType = "villa" AND propertyId = ?) OR (propertyType = "room" AND propertyId IN (SELECT id FROM rooms WHERE villaLocation = ?))'
      : '';
    
    // Query 1: Get counts of different booking statuses
    const [countResults] = await db.promise().query(`
      SELECT 
        SUM(status = 'pending') AS totalPendings,
        SUM(status = 'check-in') AS totalCheckIn,
        SUM(status = 'check-out') AS totalCheckOut,
        SUM(status = 'cancelled') AS cancellations
      FROM bookings
      ${villaCondition}
    `, params);

    // Query 2: Get daily stats for last 7 days
    const [dailyResults] = await db.promise().query(`
      SELECT 
        DATE(check_in_date) AS date,
        SUM(status = 'pending') AS pendings,
        SUM(status = 'check-in') AS checkIns,
        SUM(status = 'check-out') AS checkOuts
      FROM bookings
      WHERE check_in_date >= CURDATE() - INTERVAL 7 DAY
      ${villaId ? 
        'AND ((propertyType = "villa" AND propertyId = ?) OR (propertyType = "room" AND propertyId IN (SELECT id FROM rooms WHERE villaLocation = ?)))' 
        : ''}
      GROUP BY DATE(check_in_date)
      ORDER BY date ASC
    `, params);

    // Query 3: Get booking categories (villas and rooms)
    const [categoryResults] = await db.promise().query(`
      SELECT 
        propertyType AS name,
        SUM(status = 'pending') AS pendings,
        SUM(status = 'check-in') AS checkIns,
        SUM(status = 'check-out') AS checkOuts
      FROM bookings
      ${villaCondition}
      GROUP BY propertyType
    `, params);

    res.json({
      success: true,
      data: {
        totalPendings: countResults[0].totalPendings || 0,
        totalCheckIn: countResults[0].totalCheckIn || 0,
        totalCheckOut: countResults[0].totalCheckOut || 0,
        cancellations: countResults[0].cancellations || 0,
        dailyStats: dailyResults.map(day => ({
          ...day,
          date: day.date.toISOString().split('T')[0]
        })),
        bookingCategories: categoryResults
      }
    });
  } catch (error) {
    console.error('Front Desk Dashboard Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to load dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};