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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-eco-600 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EcoFlow</span>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <div className="flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  router.pathname === link.href 
                    ? 'text-primary-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              // Authenticated user menu
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center text-sm font-medium transition-colors duration-200 ${
                    router.pathname === '/dashboard'
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
                <div className="relative">
                  <button className="p-1 text-gray-600 hover:text-gray-900 transition-colors duration-200">
                    <BellIcon className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  <LogoutIcon className="h-4 w-4 mr-1" />
                  Logout
                </button>
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-eco-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </>
            ) : (
              // Guest user links
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

        </div>

      </div>
    </nav>
  );
};

export default Navigation;
