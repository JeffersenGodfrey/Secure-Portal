const mysql = require('mysql2/promise');

const useSSL = process.env.MYSQL_SSL !== 'false';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(useSSL ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false } } : {}),
});

module.exports = pool;