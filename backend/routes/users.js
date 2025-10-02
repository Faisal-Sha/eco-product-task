const express = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

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

// GET /api/users - Get all users (Admin only)
router.get('/',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find({ isActive: true })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments({ isActive: true })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: users,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Failed to fetch users'
      });
    }
  }
);

// GET /api/users/:id - Get user by ID (Admin or own profile)
router.get('/:id',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Check if user is admin or requesting their own profile
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Access denied. You can only view your own profile.'
        });
      }

      const user = await User.findById(userId).lean();
      
      if (!user || !user.isActive) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Failed to fetch user'
      });
    }
  }
);

// PUT /api/users/:id - Update user profile
router.put('/:id',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name').optional().isLength({ min: 2, max: 50 }).trim(),
    body('profile.phone').optional().matches(/^\+?[\d\s-()]+$/),
    body('profile.dateOfBirth').optional().isISO8601(),
    body('profile.address.street').optional().isString().trim(),
    body('profile.address.city').optional().isString().trim(),
    body('profile.address.state').optional().isString().trim(),
    body('profile.address.zipCode').optional().isString().trim(),
    body('profile.address.country').optional().isString().trim(),
    body('preferences.newsletter').optional().isBoolean(),
    body('preferences.marketing').optional().isBoolean(),
    body('preferences.currency').optional().isIn(['USD', 'EUR', 'GBP']),
    body('preferences.language').optional().isIn(['en', 'es', 'fr'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Check if user is admin or updating their own profile
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Access denied. You can only update your own profile.'
        });
      }

      // Remove sensitive fields that shouldn't be updated via this route
      delete req.body.email;
      delete req.body.password;
      delete req.body.role;
      delete req.body.isActive;

      const user = await User.findByIdAndUpdate(
        userId,
        req.body,
        { new: true, runValidators: true }
      ).lean();

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Failed to update user'
      });
    }
  }
);

// DELETE /api/users/:id - Deactivate user account
router.delete('/:id',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Check if user is admin or deleting their own account
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Access denied. You can only delete your own account.'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      ).lean();

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Account deactivated successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        error: 'Failed to deactivate account'
      });
    }
  }
);

// PUT /api/users/:id/role - Update user role (Admin only)
router.put('/:id/role',
  authenticateToken,
  requireAdmin,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;

      // Prevent admin from changing their own role
      if (req.user._id.toString() === userId) {
        return res.status(400).json({
          error: 'You cannot change your own role'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      ).lean();

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user,
        message: `User role updated to ${role}`
      });

    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        error: 'Failed to update user role'
      });
    }
  }
);

// GET /api/users/stats/dashboard - Get user statistics (Admin only)
router.get('/stats/dashboard',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await User.aggregate([
        {
          $facet: {
            totalUsers: [
              { $match: { isActive: true } },
              { $count: 'count' }
            ],
            totalAdmins: [
              { $match: { isActive: true, role: 'admin' } },
              { $count: 'count' }
            ],
            usersByMonth: [
              { $match: { isActive: true } },
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.year': -1, '_id.month': -1 } },
              { $limit: 12 }
            ],
            recentUsers: [
              { $match: { isActive: true } },
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  name: 1,
                  email: 1,
                  createdAt: 1,
                  lastLogin: 1,
                  loginCount: 1
                }
              }
            ]
          }
        }
      ]);

      const result = stats[0];

      res.json({
        success: true,
        data: {
          totalUsers: result.totalUsers[0]?.count || 0,
          totalAdmins: result.totalAdmins[0]?.count || 0,
          usersByMonth: result.usersByMonth,
          recentUsers: result.recentUsers
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch user statistics'
      });
    }
  }
);

module.exports = router;
