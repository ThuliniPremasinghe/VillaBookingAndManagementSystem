import { query } from "../models/VillaModel.js";
import multer from "multer";
import fs from "fs";


// Multer Storage Configuration for Image Uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = "./uploads/villas";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage }).array("images", 5); // Allow up to 5 images

// Add a new villa
export function addVilla(req, res) {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: "Image upload failed", error: err });
    }

    const { location, distance, price, description, amenities,capacity  } = req.body;
    const images = req.files.map((file) => `/uploads/villas/${file.filename}`);

    const sql = `
  INSERT INTO villas (
    villaLocation, 
    distanceToCity, 
    pricePerDay, 
    villaDescription, 
    amenities, 
    images,
    capacity
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`;

    query(
      sql,
      [location, distance, price, description, JSON.stringify(amenities), JSON.stringify(images),capacity],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Database error", error: err });
        }
        res.status(201).json({ message: "Villa added successfully", villaId: result.insertId });
      }
    );
  });
}

// Get all villas
// Fetch Villa by ID for Editing
export function getVillaById(req, res) {
  const { id } = req.params;
  console.log("Fetching villa with ID:", id); // Debugging

  const sql = `
    SELECT 
      id, 
      villaLocation, 
      distanceToCity, 
      pricePerDay, 
      villaDescription, 
      capacity,
      COALESCE(NULLIF(amenities, ''), '[]') AS amenities, 
      COALESCE(NULLIF(images, ''), '[]') AS images
    FROM villas
    WHERE id = ?
  `;


  query(sql, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length > 0) {
      const villa = {
        ...results[0],
        amenities: JSON.parse(results[0].amenities || "[]"),
        images: JSON.parse(results[0].images || "[]"),
      };
      console.log("Villa found:", villa); // Debugging
      res.status(200).json(villa);
    } else {
      console.log("Villa not found"); // Debugging
      res.status(404).json({ message: "Villa not found" });
    }
  });
}



export function updateVilla(req, res) {
  upload(req, res, (err) => {
    if (err) {
      console.error("Image upload error:", err);
      return res.status(500).json({ message: "Image upload failed", error: err });
    }

    const { location, distance, price, description, amenities, existingImages ,capacity} = req.body;

    console.log("Received Data:", req.body); // Debugging
    console.log("Received Files:", req.files); // Debugging

    // Validate required fields
    if (!location || !distance || !price || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert amenities to JSON string if it's an array
    const amenitiesData = typeof amenities === "string" ? amenities : JSON.stringify(amenities || []);

    // Merge existing images and newly uploaded images
    const uploadedImages = req.files.map(file => `/uploads/villas/${file.filename}`);
    const allImages = [...(existingImages ? JSON.parse(existingImages) : []), ...uploadedImages];

    const sql = `
  UPDATE villas
  SET 
    villaLocation = ?, 
    distanceToCity = ?, 
    pricePerDay = ?, 
    villaDescription = ?, 
    amenities = ?, 
    images = ?,
    capacity = ?
  WHERE id = ?
`;

    query(sql, [location, distance, price, description, amenitiesData, JSON.stringify(allImages), capacity ,req.params.id], (err, result) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ message: "Error updating villa", error: err });
      }
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "Villa updated successfully" });
      } else {
        res.status(404).json({ message: "Villa not found" });
      }
    });
  });
}



export function deleteVilla(req, res) {
  const { id } = req.params;
  console.log(`Attempting to delete villa with ID: ${id}`); // Debug log

  // First, delete all rooms associated with this villa
  const deleteRoomsSql = `DELETE FROM rooms WHERE villaLocation = ?`;
  query(deleteRoomsSql, [id], (err, roomsResult) => {
    if (err) {
      console.error('Error deleting villa rooms:', err); // Detailed error log
      return res.status(500).json({ 
        message: "Error deleting villa rooms", 
        error: err.message, // Include the actual error message
        sqlError: err // Include full error details
      });
    }

    console.log(`Deleted ${roomsResult.affectedRows} rooms for villa ${id}`); // Debug log

    // Then, delete the villa
    const deleteVillaSql = `DELETE FROM villas WHERE id = ?`;
    query(deleteVillaSql, [id], (err, villaResult) => {
      if (err) {
        console.error('Error deleting villa:', err); // Detailed error log
        return res.status(500).json({ 
          message: "Error deleting villa", 
          error: err.message,
          sqlError: err
        });
      }
      
      if (villaResult.affectedRows > 0) {
        console.log(`Successfully deleted villa ${id}`); // Debug log
        res.status(200).json({ 
          message: "Villa and its rooms deleted successfully",
          roomsDeleted: roomsResult.affectedRows
        });
      } else {
        console.log(`Villa ${id} not found`); // Debug log
        res.status(404).json({ message: "Villa not found" });
      }
    });
  });
}


