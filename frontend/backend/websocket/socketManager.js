const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketManager {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.connectedUsers = new Map(); // Store connected users
    this.adminSockets = new Set(); // Store admin connections
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware for WebSocket connections
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
          socket.userId = decoded.userId;
          socket.userRole = decoded.role;
        }
        
        // Allow anonymous connections for browsing
        next();
      } catch (error) {
        // Continue without authentication for anonymous users
        next();
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}${socket.userId ? ` (User: ${socket.userId})` : ' (Anonymous)'}`);
      
      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        
        // Check if user is admin
        if (socket.userRole === 'admin') {
          this.adminSockets.add(socket.id);
        }
      }

      // Handle client events
      socket.on('join-product-room', (productId) => {
        socket.join(`product-${productId}`);
        console.log(`Client ${socket.id} joined product room: ${productId}`);
      });

      socket.on('leave-product-room', (productId) => {
        socket.leave(`product-${productId}`);
        console.log(`Client ${socket.id} left product room: ${productId}`);
      });

      socket.on('join-admin-room', () => {
        if (socket.userRole === 'admin') {
          socket.join('admin-room');
          console.log(`Admin ${socket.id} joined admin room`);
        } else {
          socket.emit('error', { message: 'Unauthorized access to admin room' });
        }
      });

      socket.on('request-product-stats', (productId) => {
        // Send current product statistics
        this.sendProductStats(socket, productId);
      });

      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id} - ${reason}`);
        
        // Clean up user connections
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
        
        this.adminSockets.delete(socket.id);
      });
    });
  }

  // Real-time product updates
  broadcastProductUpdate(productId, updateData) {
    this.io.to(`product-${productId}`).emit('product-updated', {
      productId,
      ...updateData,
      timestamp: new Date().toISOString()
    });

    // Also send to admin room
    this.io.to('admin-room').emit('product-admin-update', {
      productId,
      ...updateData,
      timestamp: new Date().toISOString()
    });

    console.log(`Broadcasted product update for ${productId}:`, updateData);
  }

  // Stock level changes
  broadcastStockUpdate(productId, newStock, previousStock) {
    const updateData = {
      type: 'stock_update',
      productId,
      stock: newStock,
      previousStock,
      isLowStock: newStock <= 10,
      isOutOfStock: newStock === 0
    };

    this.broadcastProductUpdate(productId, updateData);

    // Send low stock alerts to admins
    if (newStock <= 10 && previousStock > 10) {
      this.sendAdminAlert({
        type: 'low_stock_alert',
        productId,
        stock: newStock,
        message: `Product ${productId} is running low on stock (${newStock} remaining)`
      });
    }
  }

  // Price changes
  broadcastPriceUpdate(productId, newPrice, oldPrice) {
    const updateData = {
      type: 'price_update',
      productId,
      price: newPrice,
      oldPrice,
      discount: oldPrice > newPrice ? Math.round(((oldPrice - newPrice) / oldPrice) * 100) : null
    };

    this.broadcastProductUpdate(productId, updateData);
  }

  // New product announcements
  broadcastNewProduct(product) {
    this.io.emit('new-product', {
      type: 'new_product',
      product,
      timestamp: new Date().toISOString()
    });

    console.log('Broadcasted new product:', product.name);
  }

  // User activity updates
  broadcastUserActivity(activityData) {
    this.io.to('admin-room').emit('user-activity', {
      ...activityData,
      timestamp: new Date().toISOString()
    });
  }

  // Send product statistics
  async sendProductStats(socket, productId) {
    try {
      const Product = require('../models/Product');
      const product = await Product.findById(productId);
      
      if (product) {
        const stats = {
          id: productId,
          name: product.name,
          stock: product.stock,
          price: product.price,
          isActive: product.isActive,
          viewCount: this.getProductViewCount(productId),
          activeViewers: this.getActiveViewers(productId)
        };

        socket.emit('product-stats', stats);
      }
    } catch (error) {
      console.error('Error sending product stats:', error);
      socket.emit('error', { message: 'Failed to fetch product statistics' });
    }
  }

  // Admin alerts
  sendAdminAlert(alertData) {
    this.io.to('admin-room').emit('admin-alert', {
      ...alertData,
      timestamp: new Date().toISOString()
    });

    console.log('Sent admin alert:', alertData.message);
  }

  // Utility methods
  getProductViewCount(productId) {
    const room = this.io.sockets.adapter.rooms.get(`product-${productId}`);
    return room ? room.size : 0;
  }

  getActiveViewers(productId) {
    const room = this.io.sockets.adapter.rooms.get(`product-${productId}`);
    return room ? Array.from(room) : [];
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      authenticatedUsers: this.connectedUsers.size,
      adminConnections: this.adminSockets.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
        .filter(room => room.startsWith('product-'))
        .map(room => ({
          room,
          members: this.io.sockets.adapter.rooms.get(room).size
        }))
    };
  }
}

module.exports = SocketManager;
