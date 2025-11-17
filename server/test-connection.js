import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

console.log('\n🔍 Testing Database Connection...\n');
console.log('Environment variables:');
console.log('  DB_HOST:', process.env.DB_HOST || 'NOT SET (using default: localhost)');
console.log('  DB_PORT:', process.env.DB_PORT || 'NOT SET (using default: 5432)');
console.log('  DB_NAME:', process.env.DB_NAME || 'NOT SET (using default: react_flow_db)');
console.log('  DB_USER:', process.env.DB_USER || 'NOT SET (using default: postgres)');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET ❌');
console.log('');

if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD is not set in .env file!');
  console.error('\nPlease check your server/.env file contains:');
  console.error('  DB_PASSWORD=admin');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'react_flow_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

console.log('Attempting to connect...\n');

pool.query('SELECT NOW() as current_time, current_database() as database_name, current_user as user_name')
  .then((result) => {
    console.log('✅ Connection successful!\n');
    console.log('Database Info:');
    console.log('  Current Time:', result.rows[0].current_time);
    console.log('  Database:', result.rows[0].database_name);
    console.log('  User:', result.rows[0].user_name);
    console.log('\n✅ All good! You can now start the server.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === '28P01') {
      console.error('\n💡 Password authentication failed. Solutions:');
      console.error('\n1. Verify your PostgreSQL password:');
      console.error('   - Open pgAdmin or psql');
      console.error('   - Try logging in with username: postgres, password: admin');
      console.error('\n2. Check your .env file:');
      console.error('   - Location: server/.env');
      console.error('   - Should contain: DB_PASSWORD=admin');
      console.error('   - Make sure there are no extra spaces or quotes');
      console.error('\n3. Reset PostgreSQL password (if needed):');
      console.error('   - Open pgAdmin');
      console.error('   - Right-click on "postgres" user → Properties → Change password');
      console.error('\n4. Test connection manually:');
      console.error('   psql -h localhost -U postgres -d react_flow_db');
      console.error('   (Enter password when prompted)');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Check:');
      console.error('   1. Is PostgreSQL service running?');
      console.error('   2. Is the port correct? (default: 5432)');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Run:');
      console.error('   CREATE DATABASE react_flow_db;');
    }
    
    console.error('\nFull error details:', error);
    process.exit(1);
  });



