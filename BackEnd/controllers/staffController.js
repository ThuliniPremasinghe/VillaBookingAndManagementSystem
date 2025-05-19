import Staff from '../models/StaffModel.js';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { Sequelize } from 'sequelize';
const { Op } = Sequelize;



// Named exports for all controller methods
export const getVillaLocations = async (_req, res) => {
  try {
    db.query(
      "SELECT id, villaLocation FROM villas WHERE is_active = TRUE",
      (error, results) => {
        if (error) {
          console.error("Error fetching villa locations:", error);
          return res.status(500).json({ error: "Failed to fetch villa locations" });
        }
        res.status(200).json(results);
      }
    );
  } catch (error) {
    console.error("Error in villa locations endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const registerStaff = async (req, res) => {
  try {
    const { 
      full_name, 
      email, 
      contact_number, 
      nic, 
      user_name, 
      password, 
      confirmPassword, 
      role, 
      villa_id 
    } = req.body;

    // Validation
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!['manager', 'front_desk'].includes(role)) {
      return res.status(400).json({ error: 'Invalid staff role' });
    }

    if (!villa_id) {
      return res.status(400).json({ error: 'Villa assignment is required' });
    }

    // Check for existing email or username
    const [existingUsers] = await db.promise().query(
      `SELECT * FROM users WHERE email = ? OR user_name = ?`,
      [email, user_name]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into users table
    const [userResult] = await db.promise().query(
      `INSERT INTO users 
       (full_name, email, contact_number, nic, user_name, password, role, requires_password_reset) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [full_name, email, contact_number, nic, user_name, hashedPassword, role]
    );

    const userId = userResult.insertId;

   // Insert into appropriate staff role table
if (role === 'manager') {
  await db.promise().query(
    `INSERT INTO managers (user_id, villa_id) VALUES (?, ?)`,
    [userId, villa_id]
  );
} else if (role === 'front_desk') {
  await db.promise().query(
    `INSERT INTO front_desk_staff (user_id, villa_id) VALUES (?, ?)`,
    [userId, villa_id]
  );
}


    res.status(201).json({ 
      message: 'Staff registered successfully',
      userId,
      requiresPasswordReset: true
    });

  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({ error: 'Staff registration failed' });
  }
};


export const getAllStaff = async (req, res) => {
  try {
    const { role } = req.query;
    const staff = await Staff.getAllStaff(role);
    res.status(200).json(staff);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
};

export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.getStaffById(id);
    
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    
    res.status(200).json(staff);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Get the role from the request body, or fetch it if not provided
    let role = updates.role;
    if (!role) {
      const staff = await Staff.getStaffById(id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      role = staff.role;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const updated = await Staff.update(id, updates, role);
    
    if (!updated) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    
    res.status(200).json({ message: "Staff updated successfully" });
  } catch (err) {
    console.error("Error updating staff:", err);
    res.status(500).json({ message: "Failed to update staff", error: err.message });
  }
};


export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        code: 'INVALID_ID',
        message: "Invalid staff ID format" 
      });
    }

    if (!['manager', 'front_desk'].includes(role)) {
      return res.status(400).json({
        code: 'INVALID_ROLE', 
        message: "Role must be either 'manager' or 'front_desk'"
      });
    }

    const deleted = await Staff.delete(parseInt(id), role);

    if (!deleted) {
      return res.status(404).json({
        code: 'STAFF_NOT_FOUND',
        message: "Staff record not found or already inactive"
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Staff account deactivated successfully"
    });

  } catch (err) {
    console.error("Error in deleteStaff:", err);
    res.status(500).json({
      code: 'DELETE_FAILED',
      message: "Failed to deactivate staff account",
      error: err.message
    });
  }


};

// Default export (optional, if you still want to export as an object)
const staffController = {
  getVillaLocations,
  registerStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff
};

export default staffController;