import bcrypt from "bcryptjs";

const password = "admin123";

bcrypt.hash(password, 10).then(hash => {
  console.log("New Hash for 'admin123':", hash);
});
