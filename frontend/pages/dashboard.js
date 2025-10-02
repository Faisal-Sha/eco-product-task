import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import Link from 'next/link';
import { 
  UserIcon, 
  ShoppingBagIcon, 
  HeartIcon, 
  CogIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  BellIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    orders: 0,
    wishlist: 0,
    points: 0,
    savings: 0
  });

  // Check authentication and load user data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
      }
    }

    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    // Clear stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    toast.success('Logged out successfully!');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <>
      <Head>
        <title>Dashboard - EcoFlow Water Bottles</title>
        <meta name="description" content="Your EcoFlow account dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-eco-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">E</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">EcoFlow</span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link href="/products" className="text-gray-600 hover:text-gray-900">
                  Products
                </Link>
                <div className="relative">
                  <BellIcon className="h-6 w-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <LogoutIcon className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your EcoFlow account
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid md:grid-cols-4 gap-6"
              >
                <div className="bg-white p-6 rounded-xl shadow-soft">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <ShoppingBagIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-soft">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <HeartIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Wishlist</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.wishlist}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-soft">
                  <div className="flex items-center">
                    <div className="p-2 bg-eco-100 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-eco-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Eco Points</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.points}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-soft">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <span className="text-yellow-600 font-bold text-lg">$</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Saved</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.savings}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <ShoppingBagIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">Welcome to EcoFlow!</p>
                      <p className="text-sm text-gray-600">Account created successfully</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      Just now
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Eco Impact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gradient-to-r from-eco-500 to-eco-600 rounded-xl p-6 text-white"
              >
                <h2 className="text-xl font-bold mb-2">🌱 Your Eco Impact</h2>
                <p className="text-eco-100 mb-4">
                  Every EcoFlow purchase makes a difference!
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-eco-100">Plastic Bottles Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0kg</div>
                    <div className="text-sm text-eco-100">CO2 Reduced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0L</div>
                    <div className="text-sm text-eco-100">Water Conserved</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-600 to-eco-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="mt-4 flex justify-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? '👑 Admin' : '🌟 Member'}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/products"
                    className="flex items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <ShoppingBagIcon className="h-5 w-5 mr-3" />
                    Browse Products
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <UserIcon className="h-5 w-5 mr-3" />
                    Edit Profile
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <HeartIcon className="h-5 w-5 mr-3" />
                    My Wishlist
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <CogIcon className="h-5 w-5 mr-3" />
                    Settings
                  </Link>
                </div>
              </motion.div>

              {/* Special Offer */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white"
              >
                <h3 className="font-bold mb-2">🎉 Welcome Offer!</h3>
                <p className="text-primary-100 text-sm mb-4">
                  Get 20% off your first order with code WELCOME20
                </p>
                <Link
                  href="/products"
                  className="inline-block bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Shop Now
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
