// This file is being renamed to App.jsx.bak to avoid conflicts with App.js
// Please use App.js as the main application file
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useContext } from 'react';
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
// Import icons
import { FaShoppingCart, FaPlus, FaHome, FaUsers, FaSignOutAlt, FaUser, FaUserShield } from 'react-icons/fa';
import { AuthProvider } from './contexts/AuthContext';
import AuthContext from './contexts/AuthContext';

// Navigation component with authentication
function Navigation() {
  const { user, isAuthenticated, logout, isAdmin } = useContext(AuthContext);

  return (
    <header className="bg-gray-800 shadow-md py-4 px-4 sm:px-6 border-b border-gray-700">
      <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex items-center justify-center md:justify-start mb-4 md:mb-0">
          <FaShoppingCart className="text-blue-400 text-2xl mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">AG Shop Management</h1>
        </div>
        
        {isAuthenticated ? (
          <div className="flex flex-col md:flex-row items-center">
            <nav className="flex flex-wrap justify-center gap-2 mb-3 md:mb-0 md:mr-4">
              <Link to="/" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-blue-900 text-blue-300 hover:bg-blue-800 transition-colors duration-200 text-sm sm:text-base">
                <FaHome className="mr-2" />
                <span>Purchases</span>
              </Link>
              <Link to="/add" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-green-900 text-green-300 hover:bg-green-800 transition-colors duration-200 text-sm sm:text-base">
                <FaPlus className="mr-2" />
                <span>Add Purchase</span>
              </Link>
              
              {isAdmin() && (
                <>
                  <Link to="/customers" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-purple-900 text-purple-300 hover:bg-purple-800 transition-colors duration-200 text-sm sm:text-base">
                    <FaUsers className="mr-2" />
                    <span>Customers</span>
                  </Link>
                  <Link to="/admin/users" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-yellow-900 text-yellow-300 hover:bg-yellow-800 transition-colors duration-200 text-sm sm:text-base">
                    <FaUserShield className="mr-2" />
                    <span>Manage Users</span>
                  </Link>
                </>
              )}
            </nav>
            
            <div className="flex items-center">
              <span className="text-gray-300 mr-3">
                Hello, <span className="font-medium">{user?.username}</span>
                {isAdmin() && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-800 text-blue-200 text-xs rounded-full">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 rounded-md bg-red-900 text-red-300 hover:bg-red-800 transition-colors duration-200 text-sm"
              >
                <FaSignOutAlt className="mr-2" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-blue-900 text-blue-300 hover:bg-blue-800 transition-colors duration-200 text-sm sm:text-base">
              <FaUser className="mr-2" />
              <span>Login</span>
            </Link>
            <Link to="/register" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-green-900 text-green-300 hover:bg-green-800 transition-colors duration-200 text-sm sm:text-base">
              <FaPlus className="mr-2" />
              <span>Register</span>
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
                
                {/* Customer routes */}
                <Route path="/customers" element={<CustomerManagement />} />
              </Route>
              
              {/* Admin-only routes */}
              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/users" element={<UserList />} />
                <Route path="/users/:id" element={<UserDetails />} />
                <Route path="/users/add" element={<AddUser />} />
                <Route path="/users/edit/:id" element={<EditUser />} />
                <Route path="/customers/add" element={<AddPurchase />} />
                <Route path="/customers/edit/:id" element={<EditPurchase />} />
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
