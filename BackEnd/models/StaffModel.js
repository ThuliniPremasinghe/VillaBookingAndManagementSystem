import db from "../config/db.js";

class StaffModel {
  static async getAllStaff(role = null) {
    try {
      let query = `
        SELECT 
          u.id,
          u.full_name, 
          u.email, 
          u.contact_number,
          u.role,
          v.villaLocation,
          v.id as villa_id,
          CASE 
            WHEN u.role = 'manager' THEN m.id
            WHEN u.role = 'front_desk' THEN f.id
          END as staff_id
        FROM users u
        LEFT JOIN managers m ON u.id = m.user_id AND u.role = 'manager' AND m.is_active = TRUE
        LEFT JOIN front_desk_staff f ON u.id = f.user_id AND u.role = 'front_desk' AND f.is_active = TRUE
        LEFT JOIN villas v ON v.id = m.villa_id OR v.id = f.villa_id
        WHERE u.role IN ('manager', 'front_desk') AND u.is_active = TRUE
      `;

      if (role) {
        query += ` AND u.role = ?`;
        const [rows] = await db.promise().query(query, [role]);
        return rows;
      }

      const [rows] = await db.promise().query(query);
      return rows;
    } catch (err) {
      console.error('Error fetching all staff:', err);
      throw err;
    }
  }

  static async getStaffById(id) {
    try {
      const [rows] = await db.promise().query(`
        SELECT 
          u.*,
          v.villaLocation,
          v.id as villa_id,
          CASE 
            WHEN u.role = 'manager' THEN m.id
            WHEN u.role = 'front_desk' THEN f.id
          END as staff_id
        FROM users u
        LEFT JOIN managers m ON u.id = m.user_id AND u.role = 'manager' AND m.is_active = TRUE
        LEFT JOIN front_desk_staff f ON u.id = f.user_id AND u.role = 'front_desk' AND f.is_active = TRUE
        LEFT JOIN villas v ON v.id = m.villa_id OR v.id = f.villa_id
        WHERE u.id = ? AND u.is_active = TRUE
      `, [id]);

      return rows[0] || null;
    } catch (err) {
      console.error('Error fetching staff by ID:', err);
      throw err;
    }
  }

  static async update(id, updates, role) {
    const conn = db.promise();
    
    try {
      await conn.query("START TRANSACTION");
      
      // First check if user exists
      const [userCheck] = await conn.query(
        "SELECT * FROM users WHERE id = ? AND is_active = TRUE",
        [id]
      );
      
      if (!userCheck.length) {
        await conn.query("ROLLBACK");
        return false;
      }
      
      // Update user table fields
      const userFields = ['full_name', 'email', 'contact_number', 'nic', 'user_name'];
      const updateValues = [];
      const updateParams = [];
      
      for (const field of userFields) {
        if (updates[field] !== undefined) {
          updateValues.push(`${field} = ?`);
          updateParams.push(updates[field]);
        }
      }
      
      // Handle password separately (if provided)
      if (updates.password) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(updates.password, 10);
        updateValues.push('password = ?');
        updateParams.push(hashedPassword);
      }
      
      // Only update user table if there are fields to update
      if (updateValues.length > 0) {
        updateParams.push(id); // Add id parameter for WHERE clause
        await conn.query(
          `UPDATE users SET ${updateValues.join(', ')} WHERE id = ?`,
          updateParams
        );
      }
      
      // Handle role table updates (villa assignment)
      if (updates.villa_id) {
        const tableName = role === 'manager' ? 'managers' : 'front_desk_staff';
        
        // Check if staff role record exists
        const [roleRecord] = await conn.query(
          `SELECT * FROM ${tableName} WHERE user_id = ? AND is_active = TRUE`,
          [id]
        );
        
        if (roleRecord.length) {
          // Update existing role record
          await conn.query(
            `UPDATE ${tableName} SET villa_id = ? WHERE user_id = ? AND is_active = TRUE`,
            [updates.villa_id, id]
          );
        } else {
          // Create new role record if not exists (unlikely scenario, but handled)
          await conn.query(
            `INSERT INTO ${tableName} (user_id, villa_id, is_active) VALUES (?, ?, TRUE)`,
            [id, updates.villa_id]
          );
        }
      }
      
      // Handle role change if needed
      if (updates.role && updates.role !== userCheck[0].role) {
        // Deactivate old role
        const oldTable = userCheck[0].role === 'manager' ? 'managers' : 'front_desk_staff';
        await conn.query(
          `UPDATE ${oldTable} SET is_active = FALSE WHERE user_id = ?`,
          [id]
        );
        
        // Create new role
        const newTable = updates.role === 'manager' ? 'managers' : 'front_desk_staff';
        await conn.query(
          `INSERT INTO ${newTable} (user_id, villa_id, is_active) VALUES (?, ?, TRUE)`,
          [id, updates.villa_id]
        );
        
        // Update role in users table
        await conn.query(
          "UPDATE users SET role = ? WHERE id = ?",
          [updates.role, id]
        );
      }
      
      await conn.query("COMMIT");
      return true;
    } catch (err) {
      await conn.query("ROLLBACK");
      console.error("Error updating staff:", err);
      throw err;
    }
  }

  static async delete(id) {
    const conn = db.promise(); // use promise wrapper directly

    try {
      await conn.query("START TRANSACTION");

      const [userRows] = await conn.query(
        "SELECT role FROM users WHERE id = ? AND is_active = TRUE",
        [id]
      );

      if (!userRows.length) {
        throw new Error("User not found");
      }

      const role = userRows[0].role;
      const tableName = role === "manager" ? "managers" : "front_desk_staff";

      const [roleResult] = await conn.query(
        `UPDATE ${tableName} SET is_active = FALSE WHERE user_id = ?`,
        [id]
      );

      const [userResult] = await conn.query(
        "UPDATE users SET is_active = FALSE WHERE id = ?",
        [id]
      );

      await conn.query("COMMIT");

      return roleResult.affectedRows > 0 && userResult.affectedRows > 0;
    } catch (err) {
      await conn.query("ROLLBACK");
      console.error("Error deleting staff:", err);
      throw err;
    }
  }
}

export default StaffModel;
