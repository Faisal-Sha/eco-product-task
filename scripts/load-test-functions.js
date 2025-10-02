// Artillery processor functions for load testing
const faker = require('faker');

module.exports = {
  // Generate random user data
  generateRandomUser: (context, events, done) => {
    context.vars.randomEmail = faker.internet.email();
    context.vars.randomName = faker.name.findName();
    context.vars.randomPassword = 'Test123!';
    return done();
  },

  // Generate random product search terms
  generateSearchTerm: (context, events, done) => {
    const searchTerms = [
      'eco friendly water bottle',
      'stainless steel bottle',
      'insulated water bottle',
      'sport bottle',
      'kids water bottle',
      'premium bottle',
      'eco bottle',
      'water bottle accessories',
      'bottle cleaning kit'
    ];
    
    context.vars.searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    return done();
  },

  // Log custom metrics
  logMetrics: (requestParams, response, context, ee, next) => {
    if (response.statusCode >= 400) {
      console.log(`Error response: ${response.statusCode} for ${requestParams.url}`);
    }
    
    if (response.timings && response.timings.response > 1000) {
      console.log(`Slow response: ${response.timings.response}ms for ${requestParams.url}`);
    }
    
    return next();
  },

  // Set authentication header
  setAuthHeader: (context, events, done) => {
    if (context.vars.auth_token) {
      context.vars.authHeader = `Bearer ${context.vars.auth_token}`;
    }
    return done();
  },

  // Validate response data
  validateProductResponse: (requestParams, response, context, ee, next) => {
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        if (!data.success || !data.data) {
          console.log('Invalid product response structure');
          ee.emit('error', 'Invalid response structure');
        }
        
        if (Array.isArray(data.data)) {
          data.data.forEach(product => {
            if (!product.name || !product.price || !product.id) {
              console.log('Product missing required fields');
              ee.emit('error', 'Product missing required fields');
            }
          });
        }
      } catch (error) {
        console.log('Failed to parse JSON response');
        ee.emit('error', 'Invalid JSON response');
      }
    }
    return next();
  },

  // Simulate user think time with variability
  randomThinkTime: (context, events, done) => {
    // Random think time between 0.5 and 3 seconds
    const thinkTime = Math.random() * 2500 + 500;
    setTimeout(done, thinkTime);
  },

  // Track custom business metrics
  trackBusinessMetrics: (context, events, done) => {
    if (!context.vars._metrics) {
      context.vars._metrics = {
        productsViewed: 0,
        searchesPerformed: 0,
        authAttempts: 0,
        errorsEncountered: 0
      };
    }
    
    // This would be called in different scenarios to track metrics
    return done();
  },

  // Generate realistic product view patterns
  generateViewPattern: (context, events, done) => {
    // 60% view featured products, 30% browse by category, 10% search
    const rand = Math.random();
    
    if (rand < 0.6) {
      context.vars.viewType = 'featured';
    } else if (rand < 0.9) {
      context.vars.viewType = 'category';
      context.vars.category = ['water-bottles', 'accessories', 'bundles'][Math.floor(Math.random() * 3)];
    } else {
      context.vars.viewType = 'search';
    }
    
    return done();
  },

  // Simulate cart abandonment patterns  
  simulateCartBehavior: (context, events, done) => {
    // 70% add to cart, 40% of those proceed to checkout, 60% of those complete order
    const addToCart = Math.random() < 0.7;
    const proceedToCheckout = addToCart && Math.random() < 0.4;
    const completeOrder = proceedToCheckout && Math.random() < 0.6;
    
    context.vars.addToCart = addToCart;
    context.vars.proceedToCheckout = proceedToCheckout;
    context.vars.completeOrder = completeOrder;
    
    return done();
  },

  // Log performance issues
  detectPerformanceIssues: (requestParams, response, context, ee, next) => {
    const responseTime = response.timings ? response.timings.response : 0;
    
    // Log slow requests
    if (responseTime > 500) {
      console.log(`SLOW REQUEST: ${requestParams.url} took ${responseTime}ms`);
      ee.emit('customStat', 'slow_requests', 1);
    }
    
    // Log rate limit hits
    if (response.statusCode === 429) {
      console.log(`RATE LIMITED: ${requestParams.url}`);
      ee.emit('customStat', 'rate_limited', 1);
    }
    
    // Log server errors
    if (response.statusCode >= 500) {
      console.log(`SERVER ERROR: ${response.statusCode} on ${requestParams.url}`);
      ee.emit('customStat', 'server_errors', 1);
    }
    
    return next();
  }
};

// If faker is not available in the environment, provide fallbacks
if (typeof faker === 'undefined') {
  const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
  const domains = ['example.com', 'test.com', 'demo.com'];
  
  module.exports.generateRandomUser = (context, events, done) => {
    const name = names[Math.floor(Math.random() * names.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const username = name.toLowerCase().replace(' ', '.');
    
    context.vars.randomEmail = `${username}@${domain}`;
    context.vars.randomName = name;
    context.vars.randomPassword = 'Test123!';
    return done();
  };
}
