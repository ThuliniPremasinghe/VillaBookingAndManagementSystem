import { hashSync } from 'bcryptjs';
const newHash = hashSync("admin123", 10);
console.log("NEW HASH:", newHash);