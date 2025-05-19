import db from "../config/db.js";

class VillaBookingModel {
  static async createBooking(bookingData) {
    const {
      villaId,
      fullName,
      email,
      contactNumber,
      nic,
      checkInDate,
      checkOutDate,
      mealPlan,
      transportation,
      specialRequest,
      totalCost
    } = bookingData;

    const query = `
      INSERT INTO villabookings (
        villa_id,
        full_name,
        email,
        contact_number,
        nic,
        check_in_date,
        check_out_date,
        meal_plan,
        transportation,
        special_request,
        total_cost,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW())
    `;

    try {
      const [result] = db.query(query, [
        villaId,
        fullName,
        email,
        contactNumber,
        nic,
        checkInDate,
        checkOutDate,
        mealPlan || null,
        transportation || null,
        specialRequest || null,
        totalCost
      ]);

      return {
        bookingId: result.insertId,
        totalCost: totalCost
      };
    } catch (error) {
      console.error("Database error in createBooking:", error);
      throw error;
    }
  }

  static async getBookedDatesByVillaId(villaId) {
    const query = `
      SELECT check_in_date, check_out_date 
      FROM villabookings 
      WHERE villa_id = ? 
      AND status = 'confirmed'
      AND check_out_date >= CURDATE()
    `;

    try {
      const [rows] = db.query(query, [villaId]);
      return rows;
    } catch (error) {
      console.error("Database error in getBookedDatesByVillaId:", error);
      throw error;
    }
  }

  static async getBookingById(bookingId) {
    const query = `
      SELECT b.*, v.villaLocation, v.pricePerDay
      FROM villabookings b
      JOIN villas v ON b.villa_id = v.id
      WHERE b.id = ?
    `;

    try {
      const [rows] = db.query(query, [bookingId]);
      return rows[0];
    } catch (error) {
      console.error("Database error in getBookingById:", error);
      throw error;
    }
  }
}

export default VillaBookingModel;