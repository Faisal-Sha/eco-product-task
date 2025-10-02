const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['water-bottles', 'accessories', 'bundles'],
    default: 'water-bottles'
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  features: [{
    type: String,
    trim: true
  }],
  specifications: {
    capacity: {
      type: String,
      required: [true, 'Capacity is required']
    },
    material: {
      type: String,
      required: [true, 'Material is required']
    },
    weight: {
      type: String
    },
    dimensions: {
      height: String,
      diameter: String
    },
    color: {
      type: String,
      required: [true, 'Color is required']
    },
    isRecyclable: {
      type: Boolean,
      default: true
    },
    isBPAFree: {
      type: Boolean,
      default: true
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  seoMetadata: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for main image
productSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain);
  return mainImg || (this.images.length > 0 ? this.images[0] : null);
});

// Indexes for performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: -1, createdAt: -1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ price: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Ensure only one main image
  if (this.images && this.images.length > 0) {
    let hasMain = false;
    for (let img of this.images) {
      if (img.isMain && !hasMain) {
        hasMain = true;
      } else if (img.isMain && hasMain) {
        img.isMain = false;
      }
    }
    // If no main image is set, make the first one main
    if (!hasMain && this.images.length > 0) {
      this.images[0].isMain = true;
    }
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
