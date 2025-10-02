import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useProductSocket } from '../src/hooks/useSocket';
import LiveUpdates from '../src/components/LiveUpdates';

const ProductsPage = ({ initialProducts = [], initialTotal = 0 }) => {
  const [products, setProducts] = useState(initialProducts);
  const [currentPage] = useState(1);
  const [totalProducts] = useState(initialTotal);
  
  // WebSocket for real-time updates
  const { stockUpdates, priceUpdates, isConnected } = useProductSocket();

  // Apply real-time updates to products
  const updatedProducts = useMemo(() => {
    return products.map(product => {
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
  }, [products, stockUpdates, priceUpdates]);

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

          {/* Live Updates Widget */}
          <div className="mb-8">
            <LiveUpdates className="max-w-md mx-auto" />
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
