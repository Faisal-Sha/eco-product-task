import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useProductSocket } from '../src/hooks/useSocket';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const ProductsPage = ({ initialProducts = [], initialTotal = 0 }) => {
  const [products, setProducts] = useState(initialProducts);
  const [allProducts] = useState(initialProducts); // Keep original for search
  const [currentPage] = useState(1);
  const [totalProducts] = useState(initialTotal);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  
  // WebSocket for real-time updates
  const { stockUpdates, priceUpdates, isConnected } = useProductSocket();

  // Apply search, filter, sort, and real-time updates
  const updatedProducts = useMemo(() => {
    let processedProducts = allProducts.map(product => {
      const productId = product._id;
      const stockUpdate = stockUpdates.get(productId);
      const priceUpdate = priceUpdates.get(productId);
      
      return {
        ...product,
        stock: stockUpdate ? stockUpdate.newStock : product.stock,
        price: priceUpdate ? priceUpdate.newPrice : product.price,
        // Add flags for visual indicators
        _hasStockUpdate: !!stockUpdate,
        _hasPriceUpdate: !!priceUpdate,
        _stockTimestamp: stockUpdate?.timestamp,
        _priceTimestamp: priceUpdate?.timestamp
      };
    });

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      processedProducts = processedProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        (product.features && product.features.some(feature => 
          feature.toLowerCase().includes(searchLower)
        ))
      );
    }

    // Apply stock filter
    if (filterBy === 'in_stock') {
      processedProducts = processedProducts.filter(product => product.stock > 0);
    } else if (filterBy === 'out_of_stock') {
      processedProducts = processedProducts.filter(product => product.stock === 0);
    }

    // Apply sorting
    processedProducts.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

    return processedProducts;
  }, [allProducts, stockUpdates, priceUpdates, searchTerm, filterBy, sortBy]);

  // Update products state when search/filter changes
  useEffect(() => {
    setProducts(updatedProducts);
  }, [updatedProducts]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <>
      <Head>
        <title>Products - EcoFlow Water Bottles</title>
        <meta name="description" content="Browse our complete collection of eco-friendly water bottles" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Our Products
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our complete collection of premium eco-friendly water bottles
            </p>
          </motion.div>

          {/* Product Search and Filters */}
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="stock">Stock Level</option>
                  </select>
                  <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Filter Dropdown */}
                <div className="relative">
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="all">All Products</option>
                    <option value="in_stock">In Stock Only</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              
              {/* Search Results Info */}
              {searchTerm && (
                <div className="mt-4 text-sm text-gray-600">
                  {updatedProducts.length > 0 
                    ? `Found ${updatedProducts.length} product${updatedProducts.length === 1 ? '' : 's'} matching "${searchTerm}"`
                    : `No products found matching "${searchTerm}"`
                  }
                </div>
              )}
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {updatedProducts.map((product, index) => (
              <motion.div
                key={product._id || index}
                variants={itemVariants}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={product.mainImage?.url || product.images?.[0]?.url || "https://res.cloudinary.com/demo/image/upload/w_300,h_300/sample.jpg"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {product.description}
                </p>

                {product.features && product.features.length > 0 && (
                  <ul className="text-xs text-gray-500 mb-4">
                    {product.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center mb-1">
                        <span className="text-eco-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Stock information */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-sm ${
                    product._hasStockUpdate 
                      ? 'text-blue-600 font-medium animate-pulse' 
                      : (product.stock > 0 ? 'text-green-600' : 'text-red-600')
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    {product._hasStockUpdate && (
                      <span className="ml-1 text-blue-500">•</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className={`font-bold text-lg ${
                      product._hasPriceUpdate 
                        ? 'text-green-600 animate-pulse' 
                        : 'text-primary-600'
                    }`}>
                      ${product.price}
                      {product._hasPriceUpdate && (
                        <span className="ml-1 text-green-500 text-sm">•</span>
                      )}
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="text-sm text-gray-500 line-through">
                        ${product.originalPrice}
                      </div>
                    )}
                  </div>
                  
                  {product.stock > 0 ? (
                    <Link 
                      href={`/products/${product._id}`}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors text-center"
                    >
                      View Details
                    </Link>
                  ) : (
                    <button 
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                      disabled
                    >
                      Out of Stock
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products available</p>
            </div>
          )}

          {totalProducts > products.length && (
            <div className="text-center mt-12">
              <p className="text-gray-600">
                Showing {products.length} of {totalProducts} products
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps() {
  try {
    // Use API_URL for server-side requests (internal Docker network)
    // Fall back to NEXT_PUBLIC_API_URL for development
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const response = await fetch(`${apiUrl}/products?limit=12`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      props: {
        initialProducts: data.success ? data.data : [],
        initialTotal: data.pagination?.totalItems || 0
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      props: {
        initialProducts: [],
        initialTotal: 0
      }
    };
  }
}

export default ProductsPage;
