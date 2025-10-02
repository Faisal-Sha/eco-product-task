require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

// Sample data
const sampleProducts = [
  {
    name: 'EcoFlow Premium Water Bottle',
    description: 'Our flagship eco-friendly water bottle made from 100% recycled materials. Features advanced temperature retention technology that keeps drinks cold for 24 hours and hot for 12 hours. The sleek design includes a leak-proof cap and comfortable grip.',
    price: 34.99,
    originalPrice: 49.99,
    category: 'water-bottles',
    images: [
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_center,f_auto,q_auto/samples/ecommerce/shoes.jpg',
        alt: 'EcoFlow Premium Water Bottle in Ocean Blue',
        isMain: true
      },
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill,g_center,f_auto,q_auto/samples/people/jazz.jpg',
        alt: 'Person using EcoFlow Premium Bottle outdoors'
      }
    ],
    features: [
      'Double-wall vacuum insulation',
      '100% BPA-free materials',
      'Leak-proof design',
      '24-hour cold retention',
      '12-hour hot retention',
      'Dishwasher safe'
    ],
    specifications: {
      capacity: '750ml (25 fl oz)',
      material: 'Recycled Stainless Steel',
      weight: '320g',
      dimensions: {
        height: '26.5cm',
        diameter: '7.3cm'
      },
      color: 'Ocean Blue',
      isRecyclable: true,
      isBPAFree: true
    },
    stock: 150,
    rating: {
      average: 4.7,
      count: 234
    },
    isFeatured: true,
    tags: ['premium', 'insulated', 'eco-friendly', 'travel'],
    seoMetadata: {
      title: 'EcoFlow Premium Insulated Water Bottle - 750ml',
      description: 'Premium eco-friendly water bottle with 24h cold retention. Made from 100% recycled materials.',
      keywords: ['eco water bottle', 'insulated bottle', 'sustainable', 'recycled']
    }
  },
  {
    name: 'EcoFlow Classic Water Bottle',
    description: 'The perfect everyday companion for staying hydrated sustainably. Made from plant-based materials with a minimalist design that fits perfectly in your bag or car cup holder.',
    price: 19.99,
    originalPrice: 24.99,
    category: 'water-bottles',
    images: [
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_center,f_auto,q_auto/samples/food/dessert.jpg',
        alt: 'EcoFlow Classic Water Bottle in Forest Green',
        isMain: true
      },
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill,g_center,f_auto,q_auto/samples/landscapes/nature-mountains.jpg',
        alt: 'Set of EcoFlow Classic bottles in different colors'
      }
    ],
    features: [
      'Lightweight design',
      'Plant-based materials',
      'Wide mouth opening',
      'Easy-grip texture',
      'Recyclable construction'
    ],
    specifications: {
      capacity: '500ml (17 fl oz)',
      material: 'Bio-based Plastic',
      weight: '120g',
      dimensions: {
        height: '22cm',
        diameter: '6.5cm'
      },
      color: 'Forest Green',
      isRecyclable: true,
      isBPAFree: true
    },
    stock: 300,
    rating: {
      average: 4.3,
      count: 567
    },
    isFeatured: true,
    tags: ['classic', 'lightweight', 'everyday', 'affordable'],
    seoMetadata: {
      title: 'EcoFlow Classic Eco-Friendly Water Bottle - 500ml',
      description: 'Lightweight sustainable water bottle made from plant-based materials. Perfect for everyday use.',
      keywords: ['eco bottle', 'plant-based', 'sustainable bottle', 'lightweight']
    }
  },
  {
    name: 'EcoFlow Sport Water Bottle',
    description: 'Designed for active lifestyles, this sport bottle features a one-handed operation cap and ergonomic design. Perfect for workouts, hiking, and outdoor adventures.',
    price: 27.99,
    originalPrice: 32.99,
    category: 'water-bottles',
    images: [
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_center,f_auto,q_auto/samples/ecommerce/leather-bag-gray.jpg',
        alt: 'EcoFlow Sport Water Bottle in Athletic Red',
        isMain: true
      },
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill,g_center,f_auto,q_auto/samples/people/kitchen-bar.jpg',
        alt: 'Athlete using EcoFlow Sport bottle during workout'
      }
    ],
    features: [
      'One-handed operation',
      'Non-slip grip',
      'Fast-flow spout',
      'Carabiner loop',
      'Impact-resistant'
    ],
    specifications: {
      capacity: '650ml (22 fl oz)',
      material: 'Recycled Tritan',
      weight: '180g',
      dimensions: {
        height: '24cm',
        diameter: '7cm'
      },
      color: 'Athletic Red',
      isRecyclable: true,
      isBPAFree: true
    },
    stock: 200,
    rating: {
      average: 4.5,
      count: 189
    },
    isFeatured: true,
    tags: ['sport', 'active', 'workout', 'outdoor'],
    seoMetadata: {
      title: 'EcoFlow Sport Water Bottle - 650ml Athletic Design',
      description: 'Sport water bottle with one-handed operation. Perfect for workouts and outdoor activities.',
      keywords: ['sport bottle', 'workout bottle', 'athletic', 'one-handed']
    }
  },
  {
    name: 'EcoFlow Kids Water Bottle',
    description: 'Fun and safe water bottle designed specifically for children. Features colorful designs, easy-to-use cap, and durable construction that can handle drops and spills.',
    price: 15.99,
    category: 'water-bottles',
    images: [
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_center,f_auto,q_auto/samples/animals/kitten-playing.gif',
        alt: 'EcoFlow Kids Water Bottle with Rainbow Design',
        isMain: true
      }
    ],
    features: [
      'Child-friendly design',
      'Spill-proof cap',
      'Colorful graphics',
      'Easy to clean',
      'Drop-resistant'
    ],
    specifications: {
      capacity: '350ml (12 fl oz)',
      material: 'Food-grade Plastic',
      weight: '85g',
      dimensions: {
        height: '18cm',
        diameter: '6cm'
      },
      color: 'Rainbow',
      isRecyclable: true,
      isBPAFree: true
    },
    stock: 120,
    rating: {
      average: 4.8,
      count: 95
    },
    isFeatured: false,
    tags: ['kids', 'children', 'colorful', 'safe'],
    seoMetadata: {
      title: 'EcoFlow Kids Water Bottle - Safe & Fun Design',
      description: 'Child-friendly eco water bottle with spill-proof design and colorful graphics.',
      keywords: ['kids bottle', 'children water bottle', 'spill-proof', 'safe']
    }
  },
  {
    name: 'Bottle Cleaning Kit',
    description: 'Complete cleaning kit for your EcoFlow bottles. Includes specialized brushes, eco-friendly cleaning tablets, and a microfiber cloth.',
    price: 12.99,
    category: 'accessories',
    images: [
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_center,f_auto,q_auto/samples/ecommerce/accessories-bag.jpg',
        alt: 'EcoFlow Bottle Cleaning Kit',
        isMain: true
      }
    ],
    features: [
      'Multiple brush sizes',
      'Eco-friendly cleaning tablets',
      'Microfiber cloth included',
      'Compatible with all bottle types'
    ],
    specifications: {
      capacity: 'N/A',
      material: 'Mixed Materials',
      weight: '150g',
      color: 'Blue/White',
      isRecyclable: true,
      isBPAFree: true
    },
    stock: 85,
    rating: {
      average: 4.4,
      count: 67
    },
    isFeatured: false,
    tags: ['cleaning', 'maintenance', 'accessories', 'kit'],
    seoMetadata: {
      title: 'EcoFlow Bottle Cleaning Kit - Complete Care Set',
      description: 'Professional cleaning kit for water bottles with eco-friendly cleaning tablets.',
      keywords: ['bottle cleaning', 'cleaning kit', 'bottle care', 'eco cleaning']
    }
  },
  {
    name: 'EcoFlow Starter Bundle',
    description: 'Perfect starter set including our Classic bottle, Sport bottle, and cleaning kit. Great value for families or as a gift.',
    price: 54.99,
    originalPrice: 64.97,
    category: 'bundles',
    images: [
      {
        url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_center,f_auto,q_auto/samples/ecommerce/car-interior-design.jpg',
        alt: 'EcoFlow Starter Bundle with multiple bottles',
        isMain: true
      }
    ],
    features: [
      'Classic 500ml bottle',
      'Sport 650ml bottle',
      'Complete cleaning kit',
      'Gift box packaging',
      'Free shipping included'
    ],
    specifications: {
      capacity: 'Multiple sizes',
      material: 'Mixed Materials',
      weight: '650g total',
      color: 'Assorted',
      isRecyclable: true,
      isBPAFree: true
    },
    stock: 50,
    rating: {
      average: 4.9,
      count: 124
    },
    isFeatured: true,
    tags: ['bundle', 'starter', 'value', 'gift'],
    seoMetadata: {
      title: 'EcoFlow Starter Bundle - Complete Hydration Set',
      description: 'Value bundle with Classic bottle, Sport bottle, and cleaning kit. Perfect starter set.',
      keywords: ['bottle bundle', 'starter set', 'value pack', 'eco bottles']
    }
  }
];

// MongoDB init script content for docker-entrypoint-initdb.d
const mongoInitScript = `
// Create database and user (if needed)
db = db.getSiblingDB('ecostore');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        role: { enum: ['user', 'admin'] }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description', 'price', 'category'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        price: { bsonType: 'number', minimum: 0 },
        category: { enum: ['water-bottles', 'accessories', 'bundles'] }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: -1 });

db.products.createIndex({ category: 1, isActive: 1 });
db.products.createIndex({ isFeatured: -1, createdAt: -1 });
db.products.createIndex({ 'rating.average': -1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ tags: 1 });
db.products.createIndex({ name: 'text', description: 'text' });

print('Database initialization completed successfully!');
`;

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecostore?authSource=admin');
    console.log('Connected to MongoDB');

    // Clear existing products
    console.log('Clearing existing products...');
    await Product.deleteMany({});

    // Insert products
    console.log('Seeding products...');
    const products = await Product.insertMany(sampleProducts);
    console.log(`Created ${products.length} products`);

    console.log('Database seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Create MongoDB init script
const createMongoInitScript = () => {
  const fs = require('fs');
  const path = require('path');
  
  const scriptsDir = path.join(__dirname, '../..');
  const initScriptPath = path.join(scriptsDir, 'init-mongo.js');
  
  fs.writeFileSync(initScriptPath, mongoInitScript);
  console.log('MongoDB init script created at:', initScriptPath);
};

// Export sample data for reuse in other scripts
module.exports = {
  sampleProducts,
  seedDatabase,
  createMongoInitScript
};

// Run based on command line argument (only when called directly)
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'create-init-script') {
    createMongoInitScript();
  } else {
    seedDatabase();
  }
}
