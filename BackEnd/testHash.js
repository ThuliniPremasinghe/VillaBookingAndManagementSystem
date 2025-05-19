// testVerifyHash.js
const bcrypt = require('bcryptjs');

// Known good hash for "admin123"
const knownGoodHash = "$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H9QO5YQ7xzj5Xl3U.7k7Gt3JQ6O"; 

// Test 1: Verify the known good hash
bcrypt.compare("admin123", knownGoodHash)
  .then(match => console.log("Test 1 (known good hash):", match)) // Should be true
  .catch(err => console.error("Error:", err));

// Test 2: Verify your database hash
const yourHash = "$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H9QO5YQ7xzj5Xl3U.7k7Gt3JQ6O";
bcrypt.compare("admin123", yourHash)
  .then(match => console.log("Test 2 (your hash):", match))
  .catch(err => console.error("Error:", err));