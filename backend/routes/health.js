const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// GET /health - Basic health check
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'checking...',
        redis: 'checking...'
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100 + ' MB',
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100 + ' MB'
      },
      cpu: process.cpuUsage()
    };

    // Check MongoDB connection
    try {
      const mongoState = mongoose.connection.readyState;
      healthCheck.services.database = mongoState === 1 ? 'connected' : 'disconnected';
    } catch (error) {
      healthCheck.services.database = 'error';
    }

    // Check Redis connection
    try {
      const redisClient = req.app.locals.redisClient;
      if (redisClient && redisClient.isReady) {
        await redisClient.ping();
        healthCheck.services.redis = 'connected';
      } else {
        healthCheck.services.redis = 'disconnected';
      }
    } catch (error) {
      healthCheck.services.redis = 'error';
    }

    // Determine overall health status
    const allServicesHealthy = Object.values(healthCheck.services).every(
      status => status === 'connected'
    );

    if (!allServicesHealthy) {
      healthCheck.status = 'DEGRADED';
      return res.status(503).json(healthCheck);
    }

    res.json(healthCheck);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /health/ready - Readiness probe (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are available
    const checks = [];

    // Check MongoDB
    checks.push(new Promise((resolve) => {
      const mongoState = mongoose.connection.readyState;
      resolve({ service: 'mongodb', ready: mongoState === 1 });
    }));

    // Check Redis
    checks.push(new Promise(async (resolve) => {
      try {
        const redisClient = req.app.locals.redisClient;
        if (redisClient && redisClient.isReady) {
          await redisClient.ping();
          resolve({ service: 'redis', ready: true });
        } else {
          resolve({ service: 'redis', ready: false });
        }
      } catch (error) {
        resolve({ service: 'redis', ready: false });
      }
    }));

    const results = await Promise.all(checks);
    const allReady = results.every(result => result.ready);

    if (allReady) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: results
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        services: results
      });
    }

  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /health/live - Liveness probe (for Kubernetes)
router.get('/live', (req, res) => {
  // Simple liveness check - just verify the process is running
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

module.exports = router;
