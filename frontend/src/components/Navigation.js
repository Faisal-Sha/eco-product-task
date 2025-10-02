import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  ArrowLeftOnRectangleIcon as LoginIcon,
  UserPlusIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const Navigation = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
      setIsLoaded(true);
    };

    // Check auth immediately
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully!');
    router.push('/');
    setIsOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left Side */}
          <div className="flex items-center min-w-0 flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 via-primary-600 to-eco-600 rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap">EcoFlow</span>
                <span className="text-xs text-primary-600 font-medium -mt-1 whitespace-nowrap">Water Bottles</span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links - Always visible on desktop */}
          <div className="flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  router.pathname === link.href 
                    ? 'text-primary-600' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {user && (
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors duration-200 ${
                  router.pathname === '/dashboard'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
            )}
            
            {user && user.role === 'admin' && (
              <Link
                href="/admin/products"
                className={`text-sm font-medium transition-colors duration-200 ${
                  router.pathname === '/admin/products'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right Side - Auth Only */}
          <div className="flex items-center space-x-4 min-w-0 flex-shrink-0">
            {user ? (
              // Authenticated user section
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </span>
                </div>
                <div className="h-9 w-9 bg-gradient-to-br from-primary-500 via-primary-600 to-eco-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                >
                  <LogoutIcon className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              // Guest user section
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  <LoginIcon className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors transform hover:scale-105 duration-200 text-center shadow-lg hover:shadow-xl"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
