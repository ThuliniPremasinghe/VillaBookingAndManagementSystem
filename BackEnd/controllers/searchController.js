import { query } from "../models/RoomModel.js";

export const getVillaLocations = async (_req, res) => {
  try {
    const sql = "SELECT DISTINCT villaLocation FROM villas";
    query(sql, [], (err, results) => {
      if (err) {
        console.error("Database error in getVillaLocations:", err);
        return res.status(500).json({ 
          message: "Error fetching locations",
          error: process.env.NODE_ENV === 'development' ? err.message : null
        });
      }
      const locations = results.map(item => item.villaLocation);
      res.status(200).json(locations);
    });
  } catch (error) {
    console.error("Unexpected error in getVillaLocations:", error);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

export const searchProperties = async (req, res) => {
  if (!req.body.category) {
    return res.status(400).json({ message: "Category is required" });
  }

  const { selectedVilla = '', category, checkIn, checkOut, adults = 1, children = 0 } = req.body;
  const totalGuests = parseInt(adults) + parseInt(children);

  if (!checkIn || !checkOut) {
    return res.status(400).json({ message: "Both check-in and check-out dates are required" });
  }

  try {
    if (category === 'villa') {
      const sql = `
        SELECT v.* 
        FROM villas v
        WHERE (? = '' OR v.villaLocation = ?)
        AND v.capacity >= ?
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.propertyId = v.id
          AND b.propertyType = 'villa'
          AND b.status NOT IN ('check-out', 'cancelled')
          AND (
            (b.check_in_date < ? AND b.check_out_date > ?) OR
            (b.check_in_date < ? AND b.check_out_date > ?) OR
            (b.check_in_date >= ? AND b.check_out_date <= ?)
          )
        )
      `;
      
      query(sql, [
        selectedVilla, 
        selectedVilla,
        totalGuests,
        checkOut, 
        checkIn,
        checkIn, 
        checkOut,
        checkIn, 
        checkOut
      ], (err, villas) => {
        if (err) {
          console.error("Villa search error:", err);
          return res.status(500).json({ 
            message: "Error searching villas",
            error: process.env.NODE_ENV === 'development' ? err.message : null
          });
        }
        
        // Format the response with availability info
        const formattedVillas = villas.map(villa => ({
          ...villa,
          available: true,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalGuests: totalGuests
        }));
        
        res.status(200).json(formattedVillas);
      });
      
    } else if (category === 'room') {
      const sql = `
        SELECT 
          r.*, 
          v.images as villaImages,
          v.villaDescription,
          v.distanceToCity
        FROM rooms r
        JOIN villas v ON r.villaLocation = v.villaLocation
        WHERE (? = '' OR r.villaLocation = ?)
        AND r.capacity >= ?
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.propertyId = r.id
          AND b.propertyType = 'room'
          AND b.status NOT IN ('check-out', 'cancelled')
          AND (
            (b.check_in_date < ? AND b.check_out_date > ?) OR
            (b.check_in_date < ? AND b.check_out_date > ?) OR
            (b.check_in_date >= ? AND b.check_out_date <= ?)
          )
        )
      `;
      
      query(sql, [
        selectedVilla, 
        selectedVilla,
        totalGuests,
        checkOut, 
        checkIn,
        checkIn, 
        checkOut,
        checkIn, 
        checkOut
      ], (err, rooms) => {
        if (err) {
          console.error("Room search error:", err);
          return res.status(500).json({ 
            message: "Error searching rooms",
            error: process.env.NODE_ENV === 'development' ? err.message : null
          });
        }

        const formattedRooms = rooms.map(room => ({
          ...room,
          available: true,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalGuests: totalGuests,
          image: room.image ? `${process.env.BASE_URL || 'http://localhost:3037'}${room.image}` : null,
          villaImages: room.villaImages ? 
            (typeof room.villaImages === 'string' ? 
              JSON.parse(room.villaImages) : 
              room.villaImages).map(img => 
                `${process.env.BASE_URL || 'http://localhost:3037'}${img}`
            ) : []
        }));

        res.status(200).json(formattedRooms);
      });
    } else {
      res.status(400).json({ message: "Invalid category specified. Must be 'villa' or 'room'" });
    }
  } catch (error) {
    console.error("Unexpected error in searchProperties:", error);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

