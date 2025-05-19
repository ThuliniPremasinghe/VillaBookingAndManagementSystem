import { query } from "../models/RoomModel.js";
import multer from "multer";
import path from "path";

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Add Room
export function addRoom(req, res) {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: "File upload failed", error: err });
    }

    const { villaLocation, roomType,distance, pricePerDay, roomDescription, amenities,capacity  } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
    INSERT INTO rooms 
    (villaLocation, roomType, distanceToCity, pricePerDay, roomDescription, amenities, image, capacity) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  query(sql, [
    villaLocation, 
    roomType, 
    distance, 
    pricePerDay, 
    roomDescription, 
    JSON.stringify(amenities), 
    image, 
    capacity
  ], (err, result) => {
    if (err) {
      console.error("Database error:", err); // Add detailed logging
      return res.status(500).json({ 
        message: "Error adding room", 
        error: err.message // Send actual error message
      });
    }
    res.status(201).json({ message: "Room added successfully", roomId: result.insertId });
  });
});
}

// Update the getRoomById function
export function getRoomById(req, res) {
  const { id } = req.params;

  const sql = `SELECT * FROM rooms WHERE id = ?`;

  query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching room", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const room = results[0];
    
    // Properly parse amenities if it's a string
    let amenities = [];
    try {
      amenities = room.amenities ? JSON.parse(room.amenities) : [];
    } catch (e) {
      console.error("Error parsing amenities:", e);
      amenities = [];
    }

    res.status(200).json({
      ...room,
      amenities: amenities
    });
  });
}
// Fetch All Villas with Associated Rooms
export function getVillasWithRooms(_req, res) {
  const sql = `
    SELECT v.*, 
           COALESCE(NULLIF(v.amenities, ''), '[]') AS amenities,
           COALESCE(NULLIF(v.images, ''), '[]') AS images,
           IFNULL(
             (
               SELECT JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'id', r.id, 
                   'roomType', r.roomType, 
                  'distance', r.distanceToCity, 
                   'pricePerDay', r.pricePerDay, 
                   'roomDescription', r.roomDescription, 
                   'amenities', COALESCE(NULLIF(r.amenities, ''), '[]'),
                   'imageUrl', r.image,
                   'capacity', r.capacity
                 )
               )
               FROM rooms r WHERE r.villaLocation = v.villaLocation
             ), '[]'
           ) AS rooms
    FROM villas v
  `;

  query(sql, [], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching villas", error: err });
    }

    // Convert JSON fields to proper arrays
    const formattedResults = results.map((villa) => ({
      ...villa,
      amenities: JSON.parse(villa.amenities || "[]"), // Ensure amenities is an array
      images: JSON.parse(villa.images || "[]"),
      rooms: villa.rooms ? JSON.parse(villa.rooms).map((room) => ({
        ...room,
        amenities: JSON.parse(room.amenities || "[]"), // Ensure room amenities is an array
      })) : [],
    }));

    res.status(200).json(formattedResults);
  });
}


// Update Room
export function updateRoom(req, res) {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: "File upload failed", error: err });
    }

    const { id } = req.params;
    const { villaLocation, roomType,distanceToCity, pricePerDay, roomDescription, amenities, existingImage,capacity  } = req.body;
    
    // Use the new uploaded image or keep the existing one
    const image = req.file ? `/uploads/${req.file.filename}` : existingImage;

    const sql = `
      UPDATE rooms
      SET villaLocation = ?, roomType = ?,distanceToCity =?, pricePerDay = ?, roomDescription = ?, amenities = ?, image = ?,capacity = ?
      WHERE id = ?
    `;

    query(sql, [villaLocation, roomType,distanceToCity, pricePerDay, roomDescription, amenities, image,capacity, id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating room", error: err });
      }
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "Room updated successfully" });
      } else {
        res.status(404).json({ message: "Room not found" });
      }
    });
  });
}

export function deleteRoom(req, res) {
  const { id } = req.params;
  const sql = `DELETE FROM rooms WHERE id = ?`;
  query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting room", error: err });
    }
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Room deleted successfully" });
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  });
}

// Get Villa Locations
export function getVillaLocations(req, res) {
  const sql = `SELECT DISTINCT villaLocation FROM villas`;
  
  query(sql, [], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching villa locations", error: err });
    }
    const locations = results.map(row => row.villaLocation);
    res.status(200).json(locations);
  });
}
