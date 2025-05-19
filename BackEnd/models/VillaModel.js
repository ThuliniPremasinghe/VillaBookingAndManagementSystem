import db from "../config/db.js";

// Ensure the "villas" table exists
const createVillaTable = `
  CREATE TABLE IF NOT EXISTS villas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    villaLocation VARCHAR(255) NOT NULL,
    distanceToCity VARCHAR(255) NOT NULL,
    pricePerDay DECIMAL(10,2) NOT NULL,
    villaDescription TEXT NOT NULL,
    amenities TEXT NOT NULL,
    images JSON
  );
`;

db.query(createVillaTable, (err) => {
  if (err) {
    console.error("Error creating villas table:", err);
  } else {
    console.log("Villas table is ready.");
  }
});

// Export the query function properly
export function query(sql, params, callback) {
  db.query(sql, params, callback);
}



export default db;
