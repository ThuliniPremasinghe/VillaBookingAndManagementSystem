import db from '../config/db.js';

export const getManagerDashboardData = (req, res) => {
  // Extract villa location from query parameters
  const villaLocation = req.query.villaLocation;
  
  // Base conditions for all queries
  const baseCondition = villaLocation 
    ? 'WHERE (b.propertyType = "villa" AND v.villaLocation = ?) OR (b.propertyType = "room" AND r.villaLocation = ?)' 
    : 'WHERE b.propertyType IN ("villa", "room")';
  
  const params = villaLocation ? [villaLocation, villaLocation] : [];
  
  // First query - total bookings
  const totalQuery = `
    SELECT COUNT(*) AS count 
    FROM bookings b
    LEFT JOIN villas v ON b.propertyType = "villa" AND b.propertyId = v.id
    LEFT JOIN rooms r ON b.propertyType = "room" AND b.propertyId = r.id
    ${baseCondition}
  `;
  
  db.query(totalQuery, params, (totalErr, totalResults) => {
    if (totalErr) return handleError(res, totalErr);
    
    // Second query - completed bookings
    const completedCondition = villaLocation 
      ? 'WHERE b.status = "check-out" AND ((b.propertyType = "villa" AND v.villaLocation = ?) OR (b.propertyType = "room" AND r.villaLocation = ?))' 
      : 'WHERE b.status = "check-out" AND b.propertyType IN ("villa", "room")';
    
    db.query(`
      SELECT COUNT(*) AS count 
      FROM bookings b
      LEFT JOIN villas v ON b.propertyType = "villa" AND b.propertyId = v.id
      LEFT JOIN rooms r ON b.propertyType = "room" AND b.propertyId = r.id
      ${completedCondition}
    `, params, (completedErr, completedResults) => {
      if (completedErr) return handleError(res, completedErr);
      
      // Third query - cancelled bookings
      const cancelledCondition = villaLocation 
        ? 'WHERE b.status = "cancelled" AND ((b.propertyType = "villa" AND v.villaLocation = ?) OR (b.propertyType = "room" AND r.villaLocation = ?))' 
        : 'WHERE b.status = "cancelled" AND b.propertyType IN ("villa", "room")';
      
      db.query(`
        SELECT COUNT(*) AS count 
        FROM bookings b
        LEFT JOIN villas v ON b.propertyType = "villa" AND b.propertyId = v.id
        LEFT JOIN rooms r ON b.propertyType = "room" AND b.propertyId = r.id
        ${cancelledCondition}
      `, params, (cancelledErr, cancelledResults) => {
        if (cancelledErr) return handleError(res, cancelledErr);
        
        // Fourth query - pending bookings
        const pendingCondition = villaLocation 
          ? 'WHERE b.status = "pending" AND ((b.propertyType = "villa" AND v.villaLocation = ?) OR (b.propertyType = "room" AND r.villaLocation = ?))' 
          : 'WHERE b.status = "pending" AND b.propertyType IN ("villa", "room")';
        
        db.query(`
          SELECT COUNT(*) AS count 
          FROM bookings b
          LEFT JOIN villas v ON b.propertyType = "villa" AND b.propertyId = v.id
          LEFT JOIN rooms r ON b.propertyType = "room" AND b.propertyId = r.id
          ${pendingCondition}
        `, params, (pendingErr, pendingResults) => {
          if (pendingErr) return handleError(res, pendingErr);
          
          // Fifth query - booking trends
          const trendsCondition = villaLocation 
            ? 'WHERE b.check_in_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND ((b.propertyType = "villa" AND v.villaLocation = ?) OR (b.propertyType = "room" AND r.villaLocation = ?))' 
            : 'WHERE b.check_in_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND b.propertyType IN ("villa", "room")';
          
          db.query(`
            SELECT 
              DATE_FORMAT(MIN(b.check_in_date), '%b') AS name,
              COUNT(*) AS bookings,
              DATE_FORMAT(b.check_in_date, '%Y-%m') AS month_group,
              b.propertyType
            FROM bookings b
            LEFT JOIN villas v ON b.propertyType = "villa" AND b.propertyId = v.id
            LEFT JOIN rooms r ON b.propertyType = "room" AND b.propertyId = r.id
            ${trendsCondition}
            GROUP BY month_group, b.propertyType
            ORDER BY month_group ASC
            LIMIT 12
          `, params, (trendsErr, trendsResults) => {
            if (trendsErr) return handleError(res, trendsErr);
            
            // Sixth query - booking categories
            const categoriesCondition = villaLocation 
              ? 'WHERE (b.propertyType = "villa" AND v.villaLocation = ?) OR (b.propertyType = "room" AND r.villaLocation = ?)' 
              : 'WHERE b.propertyType IN ("villa", "room")';
            
            db.query(`
              SELECT
                b.propertyType AS name,
                COUNT(*) AS value
              FROM bookings b
              LEFT JOIN villas v ON b.propertyType = "villa" AND b.propertyId = v.id
              LEFT JOIN rooms r ON b.propertyType = "room" AND b.propertyId = r.id
              ${categoriesCondition}
              GROUP BY b.propertyType
            `, params, (categoriesErr, categoriesResults) => {
              if (categoriesErr) return handleError(res, categoriesErr);
              
              // Process trends data for chart
              const processedTrends = processTrendsData(trendsResults);
              
              res.json({
                success: true,
                data: {
                  totalBookings: totalResults[0].count,
                  completedBookings: completedResults[0].count,
                  cancelledBookings: cancelledResults[0].count,
                  pendingBookings: pendingResults[0].count,
                  bookingTrends: processedTrends,
                  bookingCategories: categoriesResults
                }
              });
            });
          });
        });
      });
    });
  });
};

// Helper function to process trends data for the chart
function processTrendsData(rawData) {
  const trendsMap = new Map();
  
  rawData.forEach(item => {
    if (!trendsMap.has(item.month_group)) {
      trendsMap.set(item.month_group, {
        name: item.name,
        month_group: item.month_group,
        villa: 0,
        room: 0
      });
    }
    
    const monthData = trendsMap.get(item.month_group);
    monthData[item.propertyType] = item.bookings;
  });
  
  return Array.from(trendsMap.values());
}

function handleError(res, error) {
  console.error('Manager Dashboard Error:', error);
  res.status(500).json({
    success: false,
    message: 'Failed to load manager dashboard data',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

