import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  
  // Fetch product data function
  const fetchProduct = async (showLoading = true, isPoll = false) => {
    try {
      if (showLoading) setLoading(true);
      if (isPoll) {
        setIsPolling(true);
        console.log(`🔄 Polling for product updates... (poll #${pollCount + 1})`);
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}?_t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Product not found');
      }
      
      // Check if stock has changed
      if (product && product.stock !== data.data.stock) {
        console.log(`📦 Stock updated! Old: ${product.stock}, New: ${data.data.stock}`);
      }
      
      setProduct(data.data);
      setError(null);
      setLastUpdated(new Date());
      
      if (isPoll) {
        setPollCount(prev => prev + 1);
        console.log(`✅ Poll complete. Current stock: ${data.data.stock}`);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      if (!isPoll) setError(err.message); // Don't set error for failed polls
    } finally {
      if (showLoading) setLoading(false);
      if (isPoll) setIsPolling(false);
    }
  };
  
  // Initial fetch and polling setup
  useEffect(() => {
    if (!id) return;
    
    console.log(`🚀 Setting up real-time updates for product: ${id}`);
    
    // Initial fetch
    fetchProduct();
    
    // Set up aggressive polling every 2 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchProduct(false, true); // Don't show loading, mark as poll
    }, 2000);
    
    console.log('⏰ Polling started (every 2 seconds)');
    
    // Cleanup
    return () => {
      console.log('🛑 Stopping real-time updates');
      clearInterval(pollInterval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Product...</h2>
          <p className="text-gray-600">Please wait while we fetch the product details.</p>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link 
            href="/products" 
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product._id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });
      
      if (response.ok) {
        alert(`Successfully purchased ${quantity} ${product.name}(s)!`);
        // Reset quantity to 1
        setQuantity(1);
        // Immediately fetch fresh product data to reflect updated stock
        await fetchProduct(false);
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      alert('Failed to complete purchase. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>{product.name} - EcoFlow Water Bottles</title>
        <meta name="description" content={product.description} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link 
              href="/products" 
              className="flex items-center text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Products
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="aspect-square mb-4 bg-white rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={product.images?.[selectedImage]?.url || "https://res.cloudinary.com/demo/image/upload/w_500,h_500,c_fill,g_center,f_auto,q_auto/samples/ecommerce/shoes.jpg"}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center mb-6">
                <div className="flex items-center mr-4">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < Math.floor(product.rating?.average || 0)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {product.rating?.average} ({product.rating?.count} reviews)
                  </span>
                </div>
              </div>

              <div className="flex items-center mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  ${product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl text-gray-500 line-through ml-3">
                    ${product.originalPrice}
                  </span>
                )}
              </div>

              <div className={`text-sm mb-4 ${
                product.stock > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
              
              {/* Real-time update indicator */}
              {lastUpdated && (
                <div className="text-xs text-gray-500 mb-6 space-y-1">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      isPolling ? 'bg-blue-400 animate-spin' : 'bg-green-400 animate-pulse'
                    }`}></div>
                    {isPolling ? 'Checking for updates...' : 'Live updates active'} 
                    • Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                  <div className="text-gray-400">
                    Poll count: {pollCount} • Updates every 2 seconds
                  </div>
                </div>
              )}

              <p className="text-gray-700 leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <span className="text-eco-500 mr-3">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => {
                      if (typeof value === 'object' && value !== null) {
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span>{JSON.stringify(value)}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purchase Section */}
              {product.stock > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="text-sm font-medium text-gray-700">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {[...Array(Math.min(10, product.stock))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handlePurchase}
                    className="w-full bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Purchase Now - ${(product.price * quantity).toFixed(2)}
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This is a demo purchase simulation
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

// Using client-side rendering instead of server-side rendering

export default ProductDetailPage;
