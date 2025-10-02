require('dotenv').config();
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const Product = require('../models/Product');

const STARTUP_TIMEOUT = 60000; // 60 seconds timeout for database operations

async function checkDatabaseConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecostore', {
      serverSelectionTimeoutMS: 30000, // 30 second timeout
    });
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    return false;
  }
}

async function checkIfDataExists() {
  try {
    const productCount = await Product.countDocuments();
    console.log(`📊 Current data status: ${productCount} products`);
    
    // If we have products, assume database is already seeded
    return productCount > 0;
  } catch (error) {
    console.error('❌ Error checking existing data:', error.message);
    return false;
  }
}

async function runSeeding() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Import sample products from seed.js
    const { sampleProducts } = require('./seed');

    // Clear existing products
    console.log('🧹 Clearing existing products...');
    await Product.deleteMany({});

    // Insert sample products
    console.log('🛍️ Creating products...');
    const products = await Product.insertMany(sampleProducts);

    console.log(`✅ Database seeding completed: ${products.length} products created`);
    
    return true;
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

function startServer() {
  console.log('🚀 Starting the main server...');
  
  // Close mongoose connection before starting the server
  mongoose.connection.close();
  
  // Start the main server process
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  server.on('close', (code) => {
    console.log(`🛑 Server process exited with code ${code}`);
    process.exit(code);
  });

  // Forward signals to the server process
  process.on('SIGTERM', () => {
    console.log('📢 Received SIGTERM, forwarding to server...');
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('📢 Received SIGINT, forwarding to server...');
    server.kill('SIGINT');
  });
}

async function main() {
  console.log('🔄 Starting application initialization...');
  
  // Set timeout for startup process
  const timeoutId = setTimeout(() => {
    console.error('⏰ Startup timeout reached, exiting...');
    process.exit(1);
  }, STARTUP_TIMEOUT);

  try {
    // Step 1: Connect to database
    const connected = await checkDatabaseConnection();
    if (!connected) {
      console.error('❌ Could not connect to database, exiting...');
      process.exit(1);
    }

    // Step 2: Check if seeding is needed
    const dataExists = await checkIfDataExists();
    
    if (!dataExists) {
      console.log('📦 No existing data found, running database seeding...');
      const seedSuccess = await runSeeding();
      if (!seedSuccess) {
        console.error('❌ Database seeding failed, but continuing anyway...');
      }
    } else {
      console.log('✅ Database already contains data, skipping seeding');
    }

    // Clear the timeout since we're successful
    clearTimeout(timeoutId);

    // Step 3: Start the main server
    startServer();

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
main();
