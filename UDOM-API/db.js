const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306,
  charset: 'utf8',
  waitForConnections: true,
  connectionLimit: 1,
  maxIdle: 1,
  idleTimeout: 30000,
  queueLimit: 0
});

module.exports = pool.promise();