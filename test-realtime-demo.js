#!/usr/bin/env node

/**
 * Test script for real-time updates
 * This script demonstrates how to simulate stock purchases and price changes
 * that will trigger real-time WebSocket updates to connected clients.
 */

const API_BASE = 'http://localhost:8080/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Using node built-in fetch (available in Node 18+) or fallback
const fetch = globalThis.fetch || require('node-fetch');

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE}/products?limit=5`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    log(`Error fetching products: ${error.message}`, colors.red);
    return [];
  }
}

async function simulatePurchase(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity: Math.floor(Math.random() * 3) + 1 })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Purchase successful:`, colors.green);
      log(`   Product: ${data.data.productName}`, colors.cyan);
      log(`   Quantity: ${data.data.quantity}`, colors.cyan);
      log(`   Stock: ${data.data.previousStock} → ${data.data.newStock}`, colors.yellow);
      log(`   Total Cost: $${data.data.totalPrice}`, colors.cyan);
      return true;
    } else {
      log(`❌ Purchase failed: ${data.error}`, colors.red);
      if (data.available !== undefined) {
        log(`   Available stock: ${data.available}`, colors.yellow);
      }
      return false;
    }
  } catch (error) {
    log(`❌ Purchase error: ${error.message}`, colors.red);
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPurchaseSimulation(products) {
  log(`\n📋 Stock Purchase Simulation`, colors.bright);
  log(`   Simulate product purchases to trigger stock updates`, colors.cyan);
  log('   ─────────────────────────────────────', colors.blue);
  
  if (products.length === 0) {
    log('   ⚠️  No products available for purchase simulation', colors.yellow);
    return;
  }
  
  // Simulate 3 purchases
  for (let i = 0; i < 3; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    log(`\n   🛒 Simulating purchase ${i + 1}/3...`, colors.blue);
    await simulatePurchase(randomProduct._id);
    await sleep(2000); // Wait 2 seconds between purchases
  }
}

async function main() {
  log('🚀 Real-time Updates Test Script', colors.bright + colors.green);
  log('═══════════════════════════════════════\n', colors.green);
  
  log('📡 Connecting to API...', colors.blue);
  
  // Fetch initial products
  const products = await fetchProducts();
  log(`✅ Found ${products.length} products`, colors.green);
  
  log('\n🎯 Starting purchase simulation...', colors.bright);
  log('💡 Open your browser to http://localhost:3000/products to see live updates!\n', colors.yellow);
  
  // Run purchase simulation
  await runPurchaseSimulation(products);
  
  log('\n✅ Purchase simulation completed!', colors.bright + colors.green);
  log('🔔 Check your browser for real-time stock update notifications.', colors.cyan);
  log('\n📊 You can also monitor the WebSocket connections in the browser dev tools.', colors.blue);
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Real-time Updates Test Script
=============================

Usage: node test-realtime-demo.js [options]

Options:
  --help, -h    Show this help message

This script will:
1. Fetch existing products from the API
2. Simulate product purchases (decreasing stock)
3. Trigger real-time WebSocket updates

Make sure your application is running on http://localhost:8080
Open http://localhost:3000/products to see live updates!
`);
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Script error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { simulatePurchase };
