import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
// Import icons
import { FaShoppingCart, FaPlus, FaHome, FaUsers } from 'react-icons/fa';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 shadow-md py-4 px-4 sm:px-6 border-b border-gray-700">
          <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="flex items-center justify-center md:justify-start mb-4 md:mb-0">
              <FaShoppingCart className="text-blue-400 text-2xl mr-3" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">AG Shop Management</h1>
            </div>
            <nav className="flex flex-wrap justify-center gap-2">
              <Link to="/" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-blue-900 text-blue-300 hover:bg-blue-800 transition-colors duration-200 text-sm sm:text-base">
                <FaHome className="mr-2" />
                <span>Purchases</span>
              </Link>
              {/* <Link to="/add" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-green-900 text-green-300 hover:bg-green-800 transition-colors duration-200 text-sm sm:text-base">
                <FaPlus className="mr-2" />
                <span>Add Purchase</span>
              </Link> */}
              <Link to="/users" className="flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-purple-900 text-purple-300 hover:bg-purple-800 transition-colors duration-200 text-sm sm:text-base">
                <FaUsers className="mr-2" />
                <span>Users</span>
              </Link>
            </nav>
          </div>
        </header>
        
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Routes>
            <Route path="/" element={<PurchaseList />} />
            <Route path="/add" element={<AddPurchase />} />
            <Route path="/edit/:id" element={<EditPurchase />} />
            <Route path="/purchases/:id" element={<PurchaseDetails />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/:id" element={<UserDetails />} />
            <Route path="/users/add" element={<AddUser />} />
            <Route path="/users/edit/:id" element={<EditUser />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
