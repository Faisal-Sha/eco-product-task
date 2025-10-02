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
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-eco-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EcoFlow</span>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
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
          </div>

          {/* Right Side - Search, Cart, Auth */}
          <div className="flex items-center space-x-4">
            {user ? (
              // Authenticated user section
              <>
                {/* Search Icon */}
                <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                {/* Notification Bell */}
                <div className="relative">
                  <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <BellIcon className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </button>
                </div>
                
                {/* Cart Icon */}
                <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                  </svg>
                </button>
                
                {/* User Avatar & Logout */}
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-eco-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              // Guest user section
              <>
                {/* Search Icon */}
                <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                {/* Cart Icon */}
                <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                  </svg>
                </button>
                
                {/* Auth Buttons */}
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
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
