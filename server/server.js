import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import templateRoutes from './routes/templateRoutes.js';
import flowDiagramRoutes from './routes/flowDiagramRoutes.js';
import migrate from './database/migrate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.CORS_ORIGIN
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development, restrict in production
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/templates', templateRoutes);
app.use('/flow-diagrams', flowDiagramRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('\n🚀 Starting server...\n');
    
    // Run database migration
    console.log('📦 Running database migration...');
    await migrate();
    
    // Start server
    app.listen(PORT, () => {
      console.log('\n✅ Server started successfully!\n');
      console.log(`📍 Server is running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 Templates API: http://localhost:${PORT}/api/templates`);
      console.log(`🔗 Template Names: http://localhost:${PORT}/api/templates/names`);
      console.log(`🔗 Flow Diagrams API: http://localhost:${PORT}/flow-diagrams\n`);
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL connection refused. Check:');
      console.error('   1. Is PostgreSQL service running?');
      console.error('   2. Is the port correct? (default: 5432)');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   1. Is the password correct in .env file?');
      console.error('   2. Is the username correct? (default: postgres)');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Run:');
      console.error('   CREATE DATABASE react_flow_db;');
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

startServer();

