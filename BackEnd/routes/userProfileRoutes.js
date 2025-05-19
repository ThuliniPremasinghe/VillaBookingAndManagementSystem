// routes/userProfileRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const router = express.Router();

// Get user profile
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  
  db.query(
    'SELECT id, full_name, email, contact_number, nic, user_name, created_at FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(results[0]);
    }
  );
});

// Update user profile
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const { full_name, email, contact_number, nic, user_name } = req.body;

  // Build the update query based on provided fields
  let updateFields = [];
  let updateValues = [];

  if (full_name) {
    updateFields.push('full_name = ?');
    updateValues.push(full_name);
  }
  if (email) {
    updateFields.push('email = ?');
    updateValues.push(email);
  }
  if (contact_number) {
    updateFields.push('contact_number = ?');
    updateValues.push(contact_number);
  }
  if (nic) {
    updateFields.push('nic = ?');
    updateValues.push(nic);
  }
  if (user_name) {
    updateFields.push('user_name = ?');
    updateValues.push(user_name);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  updateValues.push(userId);

  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

  db.query(query, updateValues, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get the updated user profile to return
    db.query(
      'SELECT id, full_name, email, contact_number, nic, user_name FROM users WHERE id = ?',
      [userId],
      (err, userResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({
          message: 'Profile updated successfully',
          user: userResults[0]
        });
      }
    );
  });
});

// Change password - FIXED: router path matches what frontend expects with prefix
router.post('/:id/change-password', async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  // Debug logs
  console.log('Password change request received');
  console.log('User ID:', userId);
  console.log('Request body has currentPassword:', !!currentPassword);
  console.log('Request body has newPassword:', !!newPassword);

  // Validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  try {
    // Get current password hash
    db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId],
      async (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            message: 'Database error',
            error: err.message 
          });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ 
            success: false,
            message: 'User not found' 
          });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
          return res.status(401).json({ 
            success: false,
            message: 'Current password is incorrect' 
          });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        db.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, userId],
          (err, results) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ 
                success: false,
                message: 'Database error',
                error: err.message 
              });
            }
            
            res.json({ 
              success: true,
              message: 'Password changed successfully' 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});


export default router;