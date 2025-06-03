
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  dbUrl: process.env.PG_URL || '',
};
console.log(config);
