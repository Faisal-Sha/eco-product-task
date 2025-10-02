const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const { cache, invalidateProductCache } = require('../middleware/cache');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/products - Get all products with filtering, sorting, pagination
router.get('/', 
  cache(300), // Cache for 5 minutes
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('category').optional().isIn(['water-bottles', 'accessories', 'bundles']),
    query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('featured').optional().isBoolean().toBoolean(),
    query('inStock').optional().isBoolean().toBoolean(),
    query('sortBy').optional().isIn(['price', 'name', 'rating', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('search').optional().isLength({ min: 1, max: 100 }).trim()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
        featured,
        inStock,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query;

      // Build query
      const query = { isActive: true };

      if (category) query.category = category;
      if (featured !== undefined) query.isFeatured = featured;
      if (inStock) query.stock = { $gt: 0 };

      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = minPrice;
        if (maxPrice !== undefined) query.price.$lte = maxPrice;
      }

      if (search) {
        query.$text = { $search: search };
      }

      // Build sort object
      const sort = {};
      if (search) {
        sort.score = { $meta: 'textScore' };
      }
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [products, total] = await Promise.all([
        Product.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: products,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          category,
          minPrice,
          maxPrice,
          featured,
          inStock,
          search
        }
      });

    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        error: 'Failed to fetch products'
      });
    }
  }
);

// GET /api/products/featured - Get featured products
router.get('/featured',
  cache(600), // Cache for 10 minutes
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 6;

      const products = await Product.find({
        isFeatured: true,
        isActive: true,
        stock: { $gt: 0 }
      })
      .sort({ 'rating.average': -1, createdAt: -1 })
      .limit(limit)
      .lean();

      res.json({
        success: true,
        data: products,
        total: products.length
      });

    } catch (error) {
      console.error('Get featured products error:', error);
      res.status(500).json({
        error: 'Failed to fetch featured products'
      });
    }
  }
);

// GET /api/products/:id - Get single product by ID
router.get('/:id',
  cache(300), // Cache for 5 minutes
  [
    param('id').isMongoId().withMessage('Invalid product ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const product = await Product.findOne({
        _id: req.params.id,
        isActive: true
      }).lean();

      if (!product) {
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        error: 'Failed to fetch product'
      });
    }
  }
);

// POST /api/products - Create new product (Admin only)
router.post('/',
  authenticateToken,
  requireAdmin,
  [
    body('name').isLength({ min: 1, max: 100 }).trim(),
    body('description').isLength({ min: 1, max: 2000 }).trim(),
    body('price').isFloat({ min: 0 }),
    body('originalPrice').optional().isFloat({ min: 0 }),
    body('category').isIn(['water-bottles', 'accessories', 'bundles']),
    body('images').isArray({ min: 1 }),
    body('images.*.url').isURL(),
    body('images.*.alt').optional().isString(),
    body('images.*.isMain').optional().isBoolean(),
    body('features').optional().isArray(),
    body('features.*').optional().isString().trim(),
    body('specifications.capacity').isLength({ min: 1 }),
    body('specifications.material').isLength({ min: 1 }),
    body('specifications.color').isLength({ min: 1 }),
    body('specifications.weight').optional().isString(),
    body('specifications.dimensions.height').optional().isString(),
    body('specifications.dimensions.diameter').optional().isString(),
    body('specifications.isRecyclable').optional().isBoolean(),
    body('specifications.isBPAFree').optional().isBoolean(),
    body('stock').isInt({ min: 0 }),
    body('isFeatured').optional().isBoolean(),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString().trim()
  ],
  handleValidationErrors,
  invalidateProductCache(),
  async (req, res) => {
    try {
      const product = new Product(req.body);
      await product.save();

      // Real-time broadcast: New product created
      if (req.app.locals.socketManager) {
        req.app.locals.socketManager.broadcastNewProduct(product.toObject());
      }

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });

    } catch (error) {
      console.error('Create product error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to create product'
      });
    }
  }
);

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().isLength({ min: 1, max: 100 }).trim(),
    body('description').optional().isLength({ min: 1, max: 2000 }).trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('originalPrice').optional().isFloat({ min: 0 }),
    body('category').optional().isIn(['water-bottles', 'accessories', 'bundles']),
    body('stock').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    body('isFeatured').optional().isBoolean()
  ],
  handleValidationErrors,
  invalidateProductCache(),
  async (req, res) => {
    try {
      // Get original product for comparison
      const originalProduct = await Product.findById(req.params.id);
      if (!originalProduct) {
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Real-time broadcasts for specific changes
      if (req.app.locals.socketManager) {
        const socketManager = req.app.locals.socketManager;
        const productId = product._id.toString();

        // Check for stock changes
        if (req.body.stock !== undefined && originalProduct.stock !== req.body.stock) {
          socketManager.broadcastStockUpdate(productId, req.body.stock, originalProduct.stock);
        }

        // Check for price changes
        if (req.body.price !== undefined && originalProduct.price !== req.body.price) {
          socketManager.broadcastPriceUpdate(productId, req.body.price, originalProduct.price);
        }

        // General product update
        socketManager.broadcastProductUpdate(productId, {
          type: 'product_update',
          changes: Object.keys(req.body),
          product: product.toObject()
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        error: 'Failed to update product'
      });
    }
  }
);

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  [
    param('id').isMongoId().withMessage('Invalid product ID')
  ],
  handleValidationErrors,
  invalidateProductCache(),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        error: 'Failed to delete product'
      });
    }
  }
);

// POST /api/products/:id/purchase - Simulate product purchase (decreases stock)
router.post('/:id/purchase',
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
  ],
  handleValidationErrors,
  invalidateProductCache(),
  async (req, res) => {
    try {
      const { quantity = 1 } = req.body;
      const productId = req.params.id;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          error: 'Product is not available'
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          available: product.stock,
          requested: quantity
        });
      }

      const originalStock = product.stock;
      const newStock = originalStock - quantity;
      
      // Update stock
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { stock: newStock },
        { new: true, runValidators: true }
      );

      // Real-time broadcast: Stock update
      if (req.app.locals.socketManager) {
        req.app.locals.socketManager.broadcastStockUpdate(productId, newStock, originalStock);
        
        // Also broadcast user activity
        req.app.locals.socketManager.broadcastUserActivity({
          type: 'purchase',
          productId: productId,
          productName: product.name,
          quantity: quantity,
          userId: req.user?.id || 'anonymous'
        });
      }

      res.json({
        success: true,
        message: `Successfully purchased ${quantity} ${product.name}(s)`,
        data: {
          productId: productId,
          productName: product.name,
          quantity: quantity,
          previousStock: originalStock,
          newStock: newStock,
          totalPrice: product.price * quantity
        }
      });

    } catch (error) {
      console.error('Purchase simulation error:', error);
      res.status(500).json({
        error: 'Failed to process purchase'
      });
    }
  }
);

// GET /api/products/categories/stats - Get category statistics
router.get('/categories/stats',
  cache(900), // Cache for 15 minutes
  async (req, res) => {
    try {
      const stats = await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            avgRating: { $avg: '$rating.average' },
            inStockCount: {
              $sum: {
                $cond: [{ $gt: ['$stock', 0] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            avgPrice: { $round: ['$avgPrice', 2] },
            minPrice: 1,
            maxPrice: 1,
            avgRating: { $round: ['$avgRating', 2] },
            inStockCount: 1,
            _id: 0
          }
        }
      ]);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get category stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch category statistics'
      });
    }
  }
);

module.exports = router;
