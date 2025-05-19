import nodemailer from 'nodemailer';
import db from '../config/db.js';

// Helper function to get system configuration
const getConfigValues = async () => {
  const [rows] = await db.promise().query('SELECT config_key, config_value FROM system_config');
  const config = {};
  rows.forEach(row => {
    config[row.config_key] = row.config_value;
  });
  return config;
};

// Helper function to get manager emails for a villa
const getManagerEmails = async (villaId) => {
  const [managers] = await db.promise().query(
    `SELECT u.email 
     FROM managers m
     JOIN users u ON m.user_id = u.id
     WHERE m.villa_id = ? AND m.is_active = TRUE`,
    [villaId]
  );
  return managers.map(m => m.email);
};

// Helper function to get front desk emails for a villa
const getFrontDeskEmails = async (villaId) => {
  const [frontDeskStaff] = await db.promise().query(
    `SELECT u.email 
     FROM front_desk_staff f
     JOIN users u ON f.user_id = u.id
     WHERE f.villa_id = ? AND f.is_active = TRUE`,
    [villaId]
  );
  return frontDeskStaff.map(f => f.email);
};

// Helper function to get admin emails
const getAdminEmails = async () => {
  const [admins] = await db.promise().query(
    `SELECT email FROM users WHERE role = 'admin'` // Assuming you have a 'role' column
  );
  return admins.map(a => a.email);
};

export const sendPaymentConfirmation = async (bookingId, paymentAmount) => {
  try {
    console.log(`Attempting to send payment confirmation for booking ${bookingId}`);
    
    // Get config values from DB
    const config = await getConfigValues();
    
    // Email credentials
    const emailUser = 'thulini.udari25@gmail.com';
    const emailPass = 'yegg mhyz onxa ecdr';

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false // For local testing only
      }
    });

    // Get booking details with villa information - FIX: Use correct column names
    const [bookings] = await db.promise().query(`
         SELECT 
      b.*,
      CASE 
        WHEN b.propertyType = 'villa' THEN v.villaLocation
        WHEN b.propertyType = 'room' THEN rv.villaLocation
        ELSE 'Unknown'
      END AS villa_name,
      CASE 
        WHEN b.propertyType = 'villa' THEN v.id
        WHEN b.propertyType = 'room' THEN r.villaLocation
        ELSE NULL
      END AS villa_id,
      b.guest_name,
      b.email AS customer_email,
      b.transportation,
      b.meal_plan,
      b.total_amount,
      b.check_in_date,
      b.check_out_date,
      b.propertyType
    FROM bookings b
    LEFT JOIN villas v ON b.propertyType = 'villa' AND b.propertyId = v.id
    LEFT JOIN rooms r ON b.propertyType = 'room' AND b.propertyId = r.id
    LEFT JOIN villas rv ON r.villaLocation = rv.villaLocation
    WHERE b.id = ?
  `, [bookingId]);

    if (!bookings || bookings.length === 0) {
      console.error(`No booking found with ID: ${bookingId}`);
      return false;
    }

    const bookingData = bookings[0];
    const {
        villa_name,
        villa_id,
        guest_name,
        customer_email,
        transportation,
        meal_plan,
        total_amount,
        check_in_date,
        check_out_date,
        propertyType

      } = bookingData;
      
    

    // Calculate payment percentage and ensure numeric values
    const numericTotalAmount = parseFloat(total_amount);
    const numericPaymentAmount = parseFloat(paymentAmount);
    const paymentPercentage = Math.round((numericPaymentAmount / numericTotalAmount) * 100);

    // Get all recipient emails
    const managerEmails = await getManagerEmails(villa_id);
    const frontDeskEmails = await getFrontDeskEmails(villa_id);
    const adminEmails = await getAdminEmails();
    
    // Combine all recipient emails
    const recipients = [
      customer_email,
      ...managerEmails,
      ...frontDeskEmails,
      ...adminEmails
    ].filter((email, index, self) => 
      email && self.indexOf(email) === index // Remove duplicates
    );

    // Format dates
    const formattedCheckIn = check_in_date ? new Date(check_in_date).toLocaleDateString() : 'Not specified';
    const formattedCheckOut = check_out_date ? new Date(check_out_date).toLocaleDateString() : 'Not specified';

   // Email content
   const mailOptions = {
    from: `"Villa Thus" <${emailUser}>`,
    to: recipients.join(','),
    subject: `Payment Confirmation for Booking at ${villa_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Payment Confirmation</h2>
        <p>Dear ${guest_name},</p>
        <p>We have received your payment of ${paymentPercentage}% ($ ${paymentAmount.toFixed(2)}) for your booking at ${villa_name}.</p>
        
        <h3 style="color: #2d3748; margin-top: 20px;">Booking Details</h3>
        
        <div style="margin: 20px 0;">
          <h4 style="margin-bottom: 10px;">Accommodation:</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Res. ID</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Category</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Meal Plan</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Transportation</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Check-In</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Check-Out</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${bookingId}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${propertyType || 'Not specified'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${meal_plan || 'Not specified'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${transportation || 'Not specified'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${formattedCheckIn}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${formattedCheckOut}</td>
              </tr>
            </tbody>
          </table>
          
          <p style="font-weight: bold;">Accommodation Total: $ ${numericTotalAmount.toFixed(2)}</p>
          ${meal_plan ? `<p>${meal_plan}: Includes Breakfast, Wi-Fi, taxes & service charge.</p>` : ''}
        </div>
        
        <div style="margin: 20px 0;">
          <h4 style="margin-bottom: 10px;">Payment Terms</h4>
          <p>30% deposit is required at the time of booking, balance due 30 days prior to arrival.</p>
          
          <h4 style="margin-bottom: 10px;">Cancellation Policy</h4>
          <p>If cancelled within 30 days of arrival 30% of full stay charge, within 14 days of arrival 50%, within 7 days of arrival 100% full stay cancellation charge.</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h4 style="margin-bottom: 10px;">Important Notes</h4>
          <ul style="padding-left: 20px; margin-top: 0;">
            <li>On "Poya" full moon Buddhist holidays, alcohol is not served in the public areas but in the privacy of your room.</li>
          </ul>
          <p>Check-in time 2:00 PM and Check-out time 11:00 AM</p>
          <p>Directions and emergency contact details are here.</p>
        </div>
        
        <p>Your booking is now confirmed. We look forward to welcoming you!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p>If you have any questions, please reply to this email.</p>
          <p style="margin-top: 20px;">+94 77 232 8333</p>
          <p>info@villathus.com</p>
          <p>459/2/1, Abimanagama Road, Gintota, Galle, Sri Lanka</p>
        </div>
      </div>
    `
  };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent:', info.messageId);
    return true;

  } catch (error) {
    console.error('Payment confirmation email error:', {
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

export default {
  sendPaymentConfirmation
};