import { createConnection } from 'mysql2';

const connection = createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Jay25#02', // Change this to your actual password
  database: 'users',
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');
});

export default connection;
