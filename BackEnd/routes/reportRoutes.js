import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Enhanced Revenue Report with payment status breakdown
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let selectClause, groupClause;
    
    // Define the SELECT and GROUP BY clauses based on groupBy parameter
    switch(groupBy) {
      case 'day':
        selectClause = 'DATE(created_at) as date';
        groupClause = 'DATE(created_at)';
        break;
      case 'week':
        selectClause = 'YEARWEEK(created_at) as week';
        groupClause = 'YEARWEEK(created_at)';
        break;
      case 'month':
        selectClause = 'DATE_FORMAT(created_at, "%Y-%m") as month';
        groupClause = 'DATE_FORMAT(created_at, "%Y-%m")';
        break;
      case 'property':
        selectClause = 'propertyId, MAX(propertyType) as propertyType';
        groupClause = 'propertyId';
        break;
      default:
        selectClause = 'DATE(created_at) as date';
        groupClause = 'DATE(created_at)';
    }
    
    // Simplified query without payment status breakdown
    let query = `
      SELECT 
        ${selectClause},
        SUM(total_amount) as total_revenue,
        SUM(amount_paid) as collected_amount,
        SUM(total_amount) - SUM(amount_paid) as unpaid_amount,
        COUNT(id) as booking_count
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
      GROUP BY ${groupClause}
      ORDER BY total_revenue DESC
    `;
    
    const [results] = await db.promise().query(query, [startDate, endDate]);
    
    // Add consistent propertyType for non-property groupings
    if (groupBy !== 'property') {
      results.forEach(item => {
        item.propertyType = 'N/A';
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

// Improved Reservation Report - Uses a single query approach to ensure totals match
router.get('/reservations', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'property' } = req.query;
    
    let selectClause, groupClause;
    
    switch(groupBy) {
      case 'property':
        selectClause = 'propertyId, MAX(propertyType) as propertyType'; // Modified
        groupClause = 'propertyId'; // Removed propertyType from GROUP BY
        break;
      case 'status':
        selectClause = 'status';
        groupClause = 'status';
        break;
      case 'payment_status':
        selectClause = 'payment_status';
        groupClause = 'payment_status';
        break;
      default:
        selectClause = 'propertyId, MAX(propertyType) as propertyType'; // Modified
        groupClause = 'propertyId'; // Removed propertyType from GROUP BY
    }
    
    // Rest of the query remains the same
    const query = `
      SELECT 
        ${selectClause},
        COUNT(id) as total_bookings,
        SUM(CASE WHEN status = 'check-out' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'check-in' THEN 1 ELSE 0 END) as checked_in_bookings,
        SUM(CASE WHEN status NOT IN ('check-out', 'pending', 'cancelled', 'check-in') OR status IS NULL THEN 1 ELSE 0 END) as other_status_bookings,
        SUM(total_amount) as potential_revenue,
        SUM(amount_paid) as actual_revenue
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
      GROUP BY ${groupClause}
      ORDER BY total_bookings DESC
    `;
    
    const [results] = await db.promise().query(query, [startDate, endDate]);
    
    // Add consistent propertyType for status/payment_status groupings
    if (groupBy === 'status' || groupBy === 'payment_status') {
      results.forEach(item => {
        item.propertyType = 'N/A';
      });
    }
    
    // Verify all totals and log any issues
    results.forEach(result => {
      const statusSum = (result.completed_bookings || 0) + 
                       (result.pending_bookings || 0) + 
                       (result.cancelled_bookings || 0) + 
                       (result.checked_in_bookings || 0) +
                       (result.other_status_bookings || 0);
                       
      if (statusSum !== result.total_bookings) {
        console.error(`Data verification error for ${groupBy === 'property' ? `Property ${result.propertyId}` : result[groupBy]}:`);
        console.error(`- Total bookings: ${result.total_bookings}`);
        console.error(`- Sum of statuses: ${statusSum}`);
        console.error(`- Completed: ${result.completed_bookings || 0}`);
        console.error(`- Pending: ${result.pending_bookings || 0}`);
        console.error(`- Cancelled: ${result.cancelled_bookings || 0}`);
        console.error(`- Checked-in: ${result.checked_in_bookings || 0}`);
        console.error(`- Other statuses: ${result.other_status_bookings || 0}`);
      }
    });
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching reservation report:', error);
    res.status(500).json({ error: 'Failed to generate reservation report' });
  }
});

// Add diagnostic endpoint to investigate booking status values
router.get('/diagnostics', async (req, res) => {
  try {
    // Get all distinct status values
    const [statusValues] = await db.promise().query(
      'SELECT DISTINCT status, COUNT(*) as count FROM bookings GROUP BY status'
    );
    
    // Get total counts
    const [totalCounts] = await db.promise().query(`
      SELECT 
        COUNT(*) as overall_total,
        COUNT(DISTINCT propertyId) as property_count,
        SUM(CASE WHEN status = 'check-out' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'check-in' THEN 1 ELSE 0 END) as checked_in_count,
        SUM(CASE WHEN status NOT IN ('check-out', 'pending', 'cancelled', 'check-in') OR status IS NULL THEN 1 ELSE 0 END) as other_count
      FROM bookings
    `);
    
    // Check property totals vs overall total
    const [propertyTotals] = await db.promise().query(`
      SELECT 
        propertyId, propertyType,
        COUNT(*) as property_total
      FROM bookings
      GROUP BY propertyId, propertyType
    `);
    
    // Sum of all property totals
    const propertyTotalSum = propertyTotals.reduce((sum, item) => sum + item.property_total, 0);
    
    // Prepare diagnostic results
    const diagnosticResults = {
      distinct_status_values: statusValues,
      total_counts: totalCounts[0],
      property_totals: propertyTotals,
      property_total_sum: propertyTotalSum,
      overall_total: totalCounts[0].overall_total,
      match: propertyTotalSum === totalCounts[0].overall_total,
      status_totals_match: (
        totalCounts[0].completed_count + 
        totalCounts[0].pending_count + 
        totalCounts[0].cancelled_count + 
        totalCounts[0].checked_in_count + 
        totalCounts[0].other_count
      ) === totalCounts[0].overall_total
    };
    
    res.json(diagnosticResults);
  } catch (error) {
    console.error('Error running diagnostics:', error);
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

export default router;