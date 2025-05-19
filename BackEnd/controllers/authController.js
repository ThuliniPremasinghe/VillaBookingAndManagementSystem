import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

dotenv.config();
// Set a default JWT secret if not in .env file
const JWT_SECRET = process.env.JWT_SECRET || '9b106425295133e61f0df56ead5400d7faa8e0f2b29b634dddaf8d5b09365691b7e08371a2195cd8d4f7717adfe0e6c4f73bb7c2cce5a892833df5c9fc5ad49a';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'thulini.udari25@gmail.com',
    pass: 'yegg mhyz onxa ecdr'
  },
  tls: {
    rejectUnauthorized: false
  }
});

const authController = {
  /**
   * User Login with role-specific data fetching
   */
  // authController.js
login: async (req, res) => {
  const { user_name, password } = req.body;
  
  try {
    // Get user record
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE user_name = ?', 
      [user_name]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Handle different roles
    let roleData = {};
    
    if (user.role === 'manager' || user.role === 'front_desk') {
      const table = user.role === 'manager' ? 'managers' : 'front_desk_staff';
      
      // Get staff assignments
      const [assignments] = await db.promise().query(
        `SELECT s.id AS staff_id, s.villa_id, v.villaLocation 
         FROM ${table} s 
         JOIN villas v ON s.villa_id = v.id 
         WHERE s.user_id = ? AND s.is_active = TRUE`,
        [user.id]
      );

      if (assignments.length === 0) {
        return res.status(403).json({ 
          error: 'No active villa assignment found' 
        });
      }

      const assignment = assignments[0];
      roleData = {
        staffId: assignment.staff_id,
        villaId: assignment.villa_id,
        villaLocation: assignment.villaLocation
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role,
        ...roleData
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.user_name,
        fullName: user.full_name,
        role: user.role,
        ...roleData
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
},

  /**
   * Customer Registration
   */
  register: (req, res) => {
    const { 
      full_name, 
      email, 
      contact_number, 
      nic, 
      user_name, 
      password, 
      confirmPassword, 
      terms_accepted 
    } = req.body;

    // Validation
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!terms_accepted) {
      return res.status(400).json({ error: 'You must accept the terms and conditions' });
    }

    // Check existing user
    db.query(
      'SELECT id FROM users WHERE user_name = ? OR email = ?',
      [user_name, email],
      async (error, existing) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (existing.length > 0) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Create customer
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          db.query(
            'INSERT INTO users (full_name, email, contact_number, nic, user_name, password, role, terms_accepted) VALUES (?, ?, ?, ?, ?, ?, "customer", ?)',
            [full_name, email, contact_number, nic, user_name, hashedPassword, terms_accepted],
            (err, result) => {
              if (err) {
                console.error('Registration error:', err);
                return res.status(500).json({ error: 'Registration failed' });
              }

              res.status(201).json({ 
                message: 'Registration successful',
                userId: result.insertId 
              });
            }
          );
        } catch (err) {
          console.error('Password hashing error:', err);
          res.status(500).json({ error: 'Registration failed' });
        }
      }
    );
  },

  // Add this new method to your authController
  forgotPassword: async (req, res) => {
    const { email } = req.body;

    try {
      // Check if user exists
      const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      
      if (users.length === 0) {
        // For security, return generic message
        return res.status(200).json({ 
          message: 'If an account exists with this email, a reset link has been sent' 
        });
      }

      const user = users[0];

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'forgot_password' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store token in database
      await db.promise().query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, resetToken, new Date(Date.now() + 3600000)]
      );

      // Send email with reset link
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: '"Villa Thus" <thulini.udari25@gmail.com>',
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; background: #16569a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
              Reset Password
            </a>
            <p style="color: #666; font-size: 0.9em;">
              This link expires in 1 hour. If you didn't request this, please ignore this email.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Password reset link sent to your email' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Error processing password reset request' });
    }
  },

  /**
   * Reset Password - Handles both first-time and forgot password flows
   */
  resetPassword: async (req, res) => {
    const { tempToken, token, newPassword } = req.body;

    try {
      let userId, userRole, villaId;

      // First-time login reset flow
      if (tempToken) {
        const decoded = jwt.verify(tempToken, JWT_SECRET);
        if (decoded.purpose !== 'password_reset') {
          return res.status(400).json({ error: 'Invalid token purpose' });
        }
        userId = decoded.userId;
      } 
      // Forgot password flow
      else if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.purpose !== 'forgot_password') {
          return res.status(400).json({ error: 'Invalid token purpose' });
        }
        
        // Verify token exists in database
        const [tokens] = await db.promise().query(
          'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
          [token]
        );
        
        if (tokens.length === 0) {
          return res.status(400).json({ error: 'Invalid or expired token' });
        }
        userId = decoded.userId;
      } else {
        return res.status(400).json({ error: 'No valid token provided' });
      }

      // Password validation
      if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters with one uppercase letter and one number' 
        });
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await db.promise().query(
        'UPDATE users SET password = ?, requires_password_reset = FALSE WHERE id = ?',
        [hashedPassword, userId]
      );

      // For forgot password flow, delete the token
      if (token) {
        await db.promise().query(
          'DELETE FROM password_reset_tokens WHERE token = ?',
          [token]
        );
      }

      // Get user info for response
      const [users] = await db.promise().query(
        'SELECT role FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.json({ message: 'Password updated successfully' });
      }

      const responseData = {
        message: 'Password updated successfully',
        role: users[0].role
      };

      // For staff roles, include villaId
      if (['manager', 'front_desk'].includes(users[0].role)) {
        const table = users[0].role === 'manager' ? 'managers' : 'front_desk_staff';
        const [result] = await db.promise().query(
          `SELECT villa_id FROM ${table} WHERE user_id = ? AND is_active = TRUE`,
          [userId]
        );
        responseData.villaId = result[0]?.villa_id;
      }

      res.json(responseData);
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Reset token has expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid reset token' });
      }
      res.status(500).json({ error: 'Error resetting password' });
    }
  }
};


/**
 * Fetches role-specific data including villa bookings and room bookings
 */
async function fetchRoleSpecificData(user, villaId) {
  const roleData = {};

  switch (user.role) {
    case 'admin':
      // Admin doesn't need specific data at login
      break;

    case 'manager':
    case 'front_desk':
      if (villaId) {
        // First get the villa's location
        const [villas] = await db.promise().query(
          'SELECT id, villaLocation FROM villas WHERE id = ?',
          [villaId]
        );

        if (villas.length === 0) {
          return roleData;
        }

        const villaLocation = villas[0].villaLocation;
        roleData.villa = villas[0];

        // Now query bookings using the villaLocation
        const [allBookings] = await db.promise().query(`
          SELECT 
            b.*, 
            b.propertyType, 
            CASE 
              WHEN b.propertyType = 'villa' THEN 'Villa'
              WHEN b.propertyType = 'room' THEN 'Room'
            END AS booking_type,
            CASE 
              WHEN b.propertyType = 'villa' THEN v.villaLocation
              WHEN b.propertyType = 'room' THEN CONCAT('Room #', r.id, ' - ', r.villaLocation)
            END AS property_name
          FROM bookings b
          LEFT JOIN villas v ON b.propertyType = 'villa' AND b.propertyId = v.id
          LEFT JOIN rooms r ON b.propertyType = 'room' AND b.propertyId = r.id
          WHERE (
            (b.propertyType = 'villa' AND b.propertyId = ?) OR
            (b.propertyType = 'room' AND r.villaLocation = ?)
          )
          ORDER BY b.check_in_date DESC
        `, [villaId, villaLocation]);

        // Separate villa and room bookings
        const villaBookings = allBookings.filter(booking => booking.propertyType === 'villa');
        const roomBookings = allBookings.filter(booking => booking.propertyType === 'room');

        roleData.bookings = {
          villa: villaBookings,
          rooms: roomBookings,
          all: allBookings
        };
      }
      break;

    case 'customer':
      const [customerBookings] = await db.promise().query(
        `SELECT * FROM bookings WHERE user_id = ? ORDER BY check_in_date DESC`,
        [user.id]
      );
      roleData.bookings = customerBookings;
      break;
  }

  return roleData;
}

export default authController;
