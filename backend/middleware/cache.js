// Cache middleware for Redis
const cache = (duration = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if user is authenticated (for personalized content)
    if (req.headers.authorization) {
      return next();
    }

    const redisClient = req.app.locals.redisClient;
    
    if (!redisClient) {
      return next();
    }

    // Create cache key from request URL and query parameters
    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      // Try to get cached response
      const cachedResponse = await redisClient.get(cacheKey);
      
      if (cachedResponse) {
        const parsedResponse = JSON.parse(cachedResponse);
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${duration}`,
          'ETag': `"${Buffer.from(cachedResponse).toString('base64').slice(0, 32)}"`
        });
        
        return res.status(parsedResponse.status).json(parsedResponse.data);
      }

      // If no cached response, capture the original response
      const originalSend = res.json;
      res.json = function(data) {
        // Cache the response
        const responseToCache = {
          status: res.statusCode,
          data: data
        };

        // Only cache successful responses (200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(cacheKey, duration, JSON.stringify(responseToCache))
            .catch(err => console.error('Redis cache set error:', err));
        }

        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${duration}`
        });

        // Call original json method
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation helper
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    const redisClient = req.app.locals.redisClient;
    
    if (!redisClient || patterns.length === 0) {
      return next();
    }

    try {
      const promises = patterns.map(async (pattern) => {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          return redisClient.del(keys);
        }
        return 0;
      });

      await Promise.all(promises);
      console.log(`Invalidated cache for patterns: ${patterns.join(', ')}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }

    next();
  };
};

// Specific cache invalidation functions
const invalidateProductCache = () => {
  return invalidateCache([
    'cache:/api/products*',
    'cache:/api/products/*'
  ]);
};

const invalidateUserCache = (userId) => {
  return invalidateCache([
    `cache:/api/users/${userId}*`,
    'cache:/api/users*'
  ]);
};

// Cache warming helper (preload cache with commonly accessed data)
const warmCache = async (req, res, next) => {
  const redisClient = req.app.locals.redisClient;
  
  if (!redisClient) {
    return next();
  }

  try {
    // Example: Warm cache for featured products
    const Product = require('../models/Product');
    const featuredProducts = await Product.find({ 
      isFeatured: true, 
      isActive: true 
    }).limit(6);

    const cacheKey = 'cache:/api/products?featured=true&limit=6';
    const responseData = {
      status: 200,
      data: {
        success: true,
        data: featuredProducts,
        total: featuredProducts.length
      }
    };

    await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
    console.log('Cache warmed for featured products');
  } catch (error) {
    console.error('Cache warming error:', error);
  }

  next();
};

module.exports = {
  cache,
  invalidateCache,
  invalidateProductCache,
  invalidateUserCache,
  warmCache
};
