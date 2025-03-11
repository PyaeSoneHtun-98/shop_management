import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaUserShield, FaShoppingCart, FaDollarSign, FaBars, FaTimes, FaUsersCog, FaPlus } from 'react-icons/fa';
import AuthContext from '../contexts/AuthContext';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isAdmin } = useContext(AuthContext);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  // Check if the current route is active
  const isActive = (path) => {
    return location.pathname === path ? 'bg-gray-700' : '';
  };

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <div className="flex items-center">
                <FaDollarSign className="h-8 w-8 text-blue-500" />
                <span className="ml-2 text-white text-lg font-semibold">PurchaseTracker</span>
              </div>
            </Link>
            
            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link 
                    to="/" 
                    className={`text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}
                  >
                    Dashboard
                  </Link>
                  
                  <Link 
                    to="/purchases" 
                    className={`text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isActive('/purchases')}`}
                  >
                    Purchases
                  </Link>
                  
                  <Link 
                    to="/add" 
                    className={`text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isActive('/add')}`}
                  >
                    New Purchase
                  </Link>
                  
                  {isAdmin() && (
                    <>
                      <Link 
                        to="/customers" 
                        className={`text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isActive('/customers')}`}
                      >
                        Customers
                      </Link>
                      
                      <Link 
                        to="/admin/users" 
                        className={`text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/users')}`}
                      >
                        <FaUsersCog className="inline mr-1" />
                        Manage Users
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <div className="mr-3 text-sm text-gray-300">
                    <span className="mr-1">Hello,</span>
                    <span className="font-medium">{user?.username}</span>
                    {isAdmin() && (
                      <span className="ml-1 px-2 py-0.5 bg-blue-800 text-blue-200 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <FaSignOutAlt className="mr-1" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link
                    to="/login"
                    className="flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <FaUser className="mr-1" />
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          {isAuthenticated ? (
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link 
                to="/" 
                className={`text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium ${isActive('/')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              
              <Link 
                to="/purchases" 
                className={`text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium ${isActive('/purchases')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Purchases
              </Link>
              
              <Link 
                to="/add" 
                className={`text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium ${isActive('/add')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaPlus className="inline mr-1" />
                New Purchase
              </Link>
              
              {isAdmin() && (
                <>
                  <Link 
                    to="/customers" 
                    className={`text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium ${isActive('/customers')}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Customers
                  </Link>
                  
                  <Link 
                    to="/admin/users" 
                    className={`text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin/users')}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUsersCog className="inline mr-1" />
                    Manage Users
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/login"
                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaUser className="inline mr-1" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
          
          {isAuthenticated && (
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="flex flex-col px-2">
                <div className="px-3 py-2 text-gray-400">
                  <p className="text-base font-medium">{user?.username}</p>
                  <p className="text-sm">
                    {isAdmin() ? (
                      <span className="flex items-center">
                        <FaUserShield className="mr-1" />
                        Administrator
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaUser className="mr-1" />
                        Regular User
                      </span>
                    )}
                  </p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  <FaSignOutAlt className="mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar; 