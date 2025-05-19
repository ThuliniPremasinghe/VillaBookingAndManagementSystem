import nodemailer from 'nodemailer';
import db from '../config/db.js';
import crypto from 'crypto';

const getConfigValues = async () => {
  const [rows] = await db.promise().query('SELECT config_key, config_value FROM system_config');
  const config = {};
  rows.forEach(row => {
    config[row.config_key] = row.config_value;
  });
  return config;
};

// Using named export
export const sendCheckoutConfirmation = async (bookingId, invoicePdf) => {
  try {
    console.log(`Attempting to send email for booking ${bookingId}`);
    
    // Get config values from DB
    const config = await getConfigValues();
    console.log('Config values:', config);
    
    // Use config values if available, otherwise use hardcoded fallbacks
    const emailUser = config['email_user'] || 'thulini.udari25@gmail.com';
    const emailPass = config['email_pass'] || 'yegg mhyz onxa ecdr';
    const frontendUrl = config['frontend_url'] || 'http://localhost:3000';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Fixed query - removed references to non-existent tables and aliases
    const [booking] = await db.promise().query(`
      SELECT 
        b.*, 
        CASE 
          WHEN b.propertyType = 'villa' THEN v.villaLocation
          WHEN b.propertyType = 'room' THEN r.roomType
          ELSE 'Unknown'
        END AS villa_name,
        CASE 
          WHEN b.propertyType = 'villa' THEN v.id
          WHEN b.propertyType = 'room' THEN b.propertyId
          ELSE NULL
        END AS villa_id,
        i.invoice_number
      FROM bookings b
      LEFT JOIN villas v ON b.propertyType = 'villa' AND b.propertyId = v.id
      LEFT JOIN rooms r ON b.propertyType = 'room' AND b.propertyId = r.id
      LEFT JOIN invoices i ON b.invoice_id = i.id
      WHERE b.id = ?
    `, [bookingId]);

    if (!booking.length) {
      console.error(`No booking found with ID: ${bookingId}`);
      return false;
    }

    const bookingData = booking[0];
    const { email, villa_name, villa_id, guest_name, invoice_number } = bookingData;
    
    if (!email) {
      console.error(`No email found for booking ID: ${bookingId}`);
      return false;
    }
    
    const reviewToken = crypto.randomBytes(32).toString('hex');

    // Insert review token into database
    await db.promise().query(
      `INSERT INTO review_tokens 
       (booking_id, token, expires) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 14 DAY))`,
      [bookingId, reviewToken]
    );

    const propertyName = villa_name || 'our property';
    const propertyId = villa_id || bookingData.propertyId;

    const mailOptions = {
      from: `"Villa Thus" <${emailUser}>`,
      to: email,
      subject: `Thank you for staying at ${villa_name || 'our villa'}, ${guest_name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d3748;">Your Checkout is Complete</h2>
          <p>Dear ${guest_name},</p>
          <p>Thank you for staying at ${propertyName}. Please find your invoice attached.</p>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #2d3748;">Share Your Experience</h3>
            <p>We'd love to hear your feedback about your stay:</p>
            <a href="${frontendUrl}/review/${propertyId}?token=${reviewToken}"  
               style="display: inline-block; background: #16569a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
              Leave a Review
            </a>
          </div>
          
          <p style="color: #666; font-size: 0.9em;">
            This review link expires in 14 days.
          </p>
          
          <p style="margin-top: 20px;">We hope to welcome you back soon!</p>

          <p style="margin-top: 20px;">+94 77 232 8333</p>
          <p>info@villathus.com</p>
          <p>459/2/1, Abimanagama Road,</p>
          <p>Gintota, Galle,</p>
          <p>Sri Lanka</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #666;">
            <p>If you have any questions about your invoice, please reply to this email.</p>
          </div>
        </div>
      `,
      attachments: invoicePdf ? [
        {
          filename: `Invoice_${invoice_number || bookingId}.pdf`,
          content: invoicePdf,
          contentType: 'application/pdf'
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;

  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};