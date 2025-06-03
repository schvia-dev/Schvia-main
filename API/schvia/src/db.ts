
import { Pool } from 'pg';
import { config } from './config';
import fs from 'fs';

export const pool = new Pool({
  connectionString: config.dbUrl,
  ssl: {
    rejectUnauthorized: true, // Keep strict SSL
    ca: fs.readFileSync('src/ca.pem').toString(),
  },
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
  
});

pool.query('SELECT 1')
  .then(() => console.log('Database connection verified.'))
  .catch((err) => console.error('Database connection failed:', err));