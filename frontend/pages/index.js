import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Mock API service - replace with actual API calls
const apiService = {
  getProducts: async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/featured`);
    return response.json();
  },
  
  submitForm: async (data) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

const HomePage = ({ variant = 'A' }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  
  // Fetch featured products function
  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/featured`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(data.data || []);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
    }
  };
  
  // Fetch featured products on client side with polling
  useEffect(() => {
    // Initial fetch
    fetchFeaturedProducts();
    
    // Set up polling every 10 seconds for featured products
    const pollInterval = setInterval(() => {
      fetchFeaturedProducts();
    }, 10000);
    
    // Cleanup
    return () => clearInterval(pollInterval);
  }, []);
  
  // A/B Testing Headlines
  const headlines = {
    A: "Hydrate Sustainably with EcoFlow",
    B: "Join the Eco Revolution - Premium Water Bottles"
  };
  
  // Parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Intersection observer for animations
  const [heroRef, heroInView] = useInView({ threshold: 0.3 });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.2 });
  const [productsRef, productsInView] = useInView({ threshold: 0.1 });
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await apiService.submitForm(data);
      if (result.success) {
        toast.success('Thank you! We\'ll be in touch soon.');
        reset();
      } else {
        throw new Error(result.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>EcoFlow - Premium Eco-Friendly Water Bottles</title>
        <meta name="description" content="Discover premium eco-friendly water bottles. Sustainable, durable, and designed for modern life." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* Hero Section with Parallax */}
      <section 
        ref={heroRef}
        className="relative min-h-screen bg-gradient-to-br from-primary-50 via-eco-50 to-primary-100 overflow-hidden"
      >
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-hero-pattern opacity-10"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        
        <div className="relative z-10 container mx-auto px-4 py-16 flex items-center min-h-screen">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {headlines[variant]}
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 leading-relaxed max-w-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Premium water bottles crafted from 100% recycled materials. 
                Keep drinks cold for 24 hours, hot for 12 hours.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <Link href="/products" className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors transform hover:scale-105 duration-200 text-center">
                  Shop Collection
                </Link>
                <button 
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  Learn More
                </button>
              </motion.div>
              
              {/* Stats */}
              <motion.div 
                className="grid grid-cols-3 gap-4 pt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">24h</div>
                  <div className="text-sm text-gray-500">Cold Retention</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-eco-600">100%</div>
                  <div className="text-sm text-gray-500">Recycled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">10k+</div>
                  <div className="text-sm text-gray-500">Happy Customers</div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ duration: 1.0, delay: 0.4 }}
              className="relative"
            >
              <div className="relative z-10">
                <Image
                  src="https://res.cloudinary.com/demo/image/upload/w_600,h_800,c_fill,g_center,f_auto,q_auto/samples/ecommerce/shoes.jpg"
                  alt="EcoFlow Premium Water Bottle"
                  width={600}
                  height={800}
                  className="rounded-2xl shadow-2xl mx-auto animate-float"
                  priority
                />
              </div>
              
              {/* Floating elements */}
              <motion.div 
                className="absolute -top-4 -right-4 w-20 h-20 bg-eco-400 rounded-full opacity-20"
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary-400 rounded-full opacity-20"
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose EcoFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Premium features that make a difference for you and the planet
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Eco-Friendly",
                description: "Made from 100% recycled materials with zero waste production",
                icon: "🌱"
              },
              {
                title: "Premium Insulation",
                description: "Double-wall vacuum insulation keeps drinks cold 24h, hot 12h",
                icon: "❄️"
              },
              {
                title: "Leak-Proof Design",
                description: "Engineered seal ensures no spills, perfect for any adventure",
                icon: "🔒"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section ref={productsRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={productsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600">
              Discover our most popular eco-friendly bottles
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {products.slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id || index}
                initial={{ opacity: 0, y: 30 }}
                animate={productsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white rounded-xl p-6 shadow-soft hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={product.images?.[0]?.url || "https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_fill,g_center,f_auto,q_auto/samples/ecommerce/shoes.jpg"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-lg text-primary-600">
                    ${product.price}
                  </div>
                  <Link 
                    href={`/products/${product._id || product.id}`}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors text-center"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Newsletter/Contact Form */}
      <section className="py-20 bg-primary-600">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Stay Updated
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Get notified about new products and exclusive offers
              </p>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      placeholder="Your Name"
                      className="w-full px-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-300"
                    />
                    {errors.name && (
                      <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      placeholder="Your Email"
                      className="w-full px-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-300"
                    />
                    {errors.email && (
                      <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Submitting...' : 'Get Updates'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

// Server-side rendering for SEO and performance
export async function getServerSideProps({ query }) {
  const variant = query.variant === 'B' ? 'B' : 'A';
  
  return {
    props: {
      variant
    }
  };
}

export default HomePage;
