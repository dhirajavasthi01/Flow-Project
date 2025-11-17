import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Log configuration (without password)
console.log('Database Configuration:');
console.log('  Host:', process.env.DB_HOST || 'localhost');
console.log('  Port:', process.env.DB_PORT || 5432);
console.log('  Database:', process.env.DB_NAME || 'react_flow_db');
console.log('  User:', process.env.DB_USER || 'postgres');
console.log('  Password:', process.env.DB_PASSWORD ? '***' : 'NOT SET');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'react_flow_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
  console.error('Full error:', err);
  process.exit(-1);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check if PostgreSQL is running');
    console.error('2. Verify .env file exists in server/ folder');
    console.error('3. Check database credentials (DB_USER, DB_PASSWORD, DB_NAME)');
    console.error('4. Ensure database "react_flow_db" exists');
    console.error('\nTo create database, run in psql:');
    console.error('  CREATE DATABASE react_flow_db;');
  } else {
    console.log('✅ Database connection test successful');
  }
});

export default pool;

