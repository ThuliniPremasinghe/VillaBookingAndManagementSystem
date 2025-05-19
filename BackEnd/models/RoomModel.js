import db from "../config/db.js"; // Ensure db.js exports the database connection

// Ensure the "rooms" table exists (including villaLocation column)
const createRoomTable = `
  CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    villaLocation VARCHAR(255) NOT NULL, 
    roomType VARCHAR(50) NOT NULL,
     distanceToCity VARCHAR(255) NOT NULL,
    pricePerDay DECIMAL(10,2) NOT NULL,
    roomDescription TEXT NOT NULL,
    amenities TEXT,
    image VARCHAR(255),
    FOREIGN KEY (villaLocation) REFERENCES villas(villaLocation) ON DELETE CASCADE
  );
`;

db.query(createRoomTable, (err) => {
  if (err) {
    console.error("Error creating rooms table:", err);
  } else {
    console.log("Rooms table is ready.");
  }
});

// Export the query function properly
export function query(sql, params, callback) {
  return db.query(sql, params, callback);
}

export default db;