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
