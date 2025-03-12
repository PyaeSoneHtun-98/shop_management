// This file is being renamed to App.jsx.bak to avoid conflicts with App.js
// Please use App.js as the main application file
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';
import './index.css'
// Import components
import PurchaseList from './components/PurchaseList';
import AddPurchase from './components/AddPurchase';
import EditPurchase from './components/EditPurchase';
import PurchaseDetails from './components/PurchaseDetails';
import UserList from './components/UserList';
import UserDetails from './components/UserDetails';
import AddUser from './components/AddUser';
import EditUser from './components/EditUser';
import Login from './components/Login';
import Register from './components/Register';
import Unauthorized from './components/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerManagement from './components/CustomerManagement';
import UserManagement from './components/UserManagement';
import CustomerList from './components/CustomerList';
import CustomerDetails from './components/CustomerDetails';
import AddCustomer from './components/AddCustomer';
import EditCustomer from './components/EditCustomer';
// Import icons
import { FaShoppingCart, FaPlus, FaHome, FaUsers, FaSignOutAlt, FaUser, FaUserShield, FaBars, FaTimes, FaUserFriends, FaUserCog } from 'react-icons/fa';
import { AuthProvider } from './contexts/AuthContext';
import AuthContext from './contexts/AuthContext';
import { useLocation } from 'react-router-dom';

// Updating Navigation component with a cleaner design
function Navigation() {
  const { user, isAuthenticated, logout, isAdmin } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const profileRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gray-800 shadow-md py-3 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FaShoppingCart className="text-blue-400 text-xl mr-2" />
              <h1 className="text-xl font-bold text-white hidden sm:block">AG Shop</h1>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu} 
              className="text-gray-400 hover:text-white"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-4">
              <Link to="/" className={`px-3 py-1.5 rounded-md text-sm ${location.pathname === '/' || location.pathname === '/purchases' ? 'bg-blue-800 text-blue-200' : 'text-gray-300 hover:bg-gray-700'}`}>
                Purchases
              </Link>
              <Link to="/customers" className={`px-3 py-1.5 rounded-md text-sm ${location.pathname === '/customers' || location.pathname.startsWith('/customers/') ? 'bg-purple-800 text-purple-200' : 'text-gray-300 hover:bg-gray-700'}`}>
                    Customers
                  </Link>
              {isAdmin() && (
                <>
                  <Link to="/admin/users" className={`px-3 py-1.5 rounded-md text-sm ${location.pathname === '/admin/users' ? 'bg-yellow-800 text-yellow-200' : 'text-gray-300 hover:bg-gray-700'}`}>
                    Users
                  </Link>
                </>
              )}
              
              <div className="border-l border-gray-600 h-5 mx-1"></div>
              
              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={toggleProfile}
                  className="flex items-center px-3 py-1.5 rounded-md text-gray-300 hover:bg-gray-700 text-sm focus:outline-none"
                >
                  <FaUser className="mr-1" />
                  <span className="mr-1">{user?.username}</span>
                  {isAdmin() && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded">
                      Admin
                    </span>
                  )}
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-700">
                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                      Signed in as <span className="font-semibold">{user?.username}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
        
        {/* Mobile Navigation */}
        {isAuthenticated && isMenuOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-gray-700 space-y-2">
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md ${location.pathname === '/' || location.pathname === '/purchases' ? 'bg-blue-800 text-blue-200' : 'text-gray-300 hover:bg-gray-700'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FaShoppingCart className="inline mr-2" /> Purchases
            </Link>
            
            {isAdmin() && (
              <>
                <Link 
                  to="/customers" 
                  className={`block px-3 py-2 rounded-md ${location.pathname === '/customers' || location.pathname.startsWith('/customers/') ? 'bg-purple-800 text-purple-200' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUserFriends className="inline mr-2" /> Customers
                </Link>
                <Link 
                  to="/admin/users" 
                  className={`block px-3 py-2 rounded-md ${location.pathname === '/admin/users' ? 'bg-yellow-800 text-yellow-200' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUserCog className="inline mr-2" /> Users
                </Link>
              </>
            )}
            
            <div className="px-3 py-2 text-sm text-gray-300">
              <FaUser className="inline mr-2" /> {user?.username}
              {isAdmin() && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded">
                  Admin
                </span>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md bg-red-800 text-red-200 hover:bg-red-700 text-sm"
            >
              <FaSignOutAlt className="inline mr-2" /> Logout
            </button>
          </nav>
        )}
        
        {/* Non-authenticated links */}
        {!isAuthenticated && (
          <div className="flex gap-2 justify-end">
            <Link to="/login" className="px-3 py-1.5 rounded-md bg-blue-800 text-blue-200 hover:bg-blue-700 text-sm">
              <FaUser className="inline mr-1" /> Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Navigation />
          
          <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes - any authenticated user */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<PurchaseList />} />
                <Route path="/purchases" element={<PurchaseList />} />
                <Route path="/purchases/:id" element={<PurchaseDetails />} />
                <Route path="/purchases/customer/:id" element={<PurchaseList />} />
                <Route path="/add" element={<AddPurchase />} />
                <Route path="/edit/:id" element={<EditPurchase />} />
                
                {/* Customer routes - correct mapping to customer components */}
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/customers/:id" element={<CustomerDetails />} />
                <Route path="/customers/add" element={<AddCustomer />} />
                <Route path="/customers/edit/:id" element={<EditCustomer />} />
              </Route>
              
              {/* Admin-only routes */}
              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/users" element={<UserList />} />
                <Route path="/users/:id" element={<UserDetails />} />
                <Route path="/users/add" element={<AddUser />} />
                <Route path="/users/edit/:id" element={<EditUser />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
