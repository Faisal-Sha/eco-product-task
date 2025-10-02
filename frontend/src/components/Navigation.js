import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  UserIcon, 
  ShoppingBagIcon, 
  Bars3Icon, 
  XMarkIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  ArrowLeftOnRectangleIcon as LoginIcon,
  UserPlusIcon
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
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-r from-primary-600 to-eco-600 rounded-xl flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">EcoFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  router.pathname === link.href ? 'text-primary-600 font-medium' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                // Authenticated user menu
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <UserIcon className="h-5 w-5 mr-1" />
                    Dashboard
                  </Link>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogoutIcon className="h-5 w-5 mr-1" />
                    Logout
                  </button>
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-eco-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              ) : (
                // Guest user links (show by default until loaded)
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LoginIcon className="h-5 w-5 mr-1" />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <UserPlusIcon className="h-5 w-5 mr-1" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 py-4"
          >
            <div className="space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block text-gray-600 hover:text-gray-900 transition-colors ${
                    router.pathname === link.href ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-gray-200 pt-4 mt-4">
                {user ? (
                  <div className="space-y-4">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <UserIcon className="h-5 w-5 mr-2" />
                      Dashboard ({user.name})
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center text-gray-600 hover:text-red-600 transition-colors w-full text-left"
                    >
                      <LogoutIcon className="h-5 w-5 mr-2" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <LoginIcon className="h-5 w-5 mr-2" />
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors w-fit"
                    >
                      <UserPlusIcon className="h-5 w-5 mr-2" />
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
