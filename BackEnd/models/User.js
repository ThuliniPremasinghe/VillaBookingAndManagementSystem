import db from '../config/db.js';

class User {
  static async initializeTable() {
    try {
      db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          contact_number VARCHAR(20) NOT NULL,
          nic VARCHAR(20) NOT NULL,
          user_name VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('customer', 'front_desk', 'manager', 'admin') NOT NULL DEFAULT 'customer',
          terms_accepted BOOLEAN DEFAULT FALSE,
          requires_password_reset BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("Users table is ready");
    } catch (err) {
      console.error("Error creating users table:", err);
      throw err;
    }
  }

  static async findByUsername(username) {
    try {
      const [rows] = db.execute(`SELECT * FROM users WHERE user_name = ?`, [username]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByUsernameOrEmail(username, email) {
    try {
      const [rows] = db.execute(
        `SELECT * FROM users WHERE user_name = ? OR email = ?`,
        [username, email]
      );
      return rows[0];
    } catch (err) {
      throw err;
    }
  }

  static async findById(id) {
    try {
      const [rows] = db.execute(`SELECT * FROM users WHERE id = ?`, [id]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  }

  static async updatePassword(userId, newPassword) {
    try {
      db.execute(
        `UPDATE users SET password = ?, requires_password_reset = FALSE WHERE id = ?`,
        [newPassword, userId]
      );
    } catch (err) {
      throw err;
    }
  }

  static async create(userData) {
    try {
      const [result] = db.execute(
        `INSERT INTO users 
        (full_name, email, contact_number, nic, user_name, password, role, terms_accepted, requires_password_reset)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.full_name,
          userData.email,
          userData.contact_number,
          userData.nic,
          userData.user_name,
          userData.password,
          userData.role || 'customer',
          userData.terms_accepted || false,
          userData.requires_password_reset || false
        ]
      );
      return result.insertId;
    } catch (err) {
      throw err;
    }
  }

  static async update(userId, updates) {
    try {
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }

      values.push(userId);

      db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    } catch (err) {
      throw err;
    }
  }
}

// Auto-initialize table
User.initializeTable().catch(err => {
  console.error("Failed to initialize users table:", err);
});

export default User;
