import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import AuthContext from '../contexts/AuthContext';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { isAdmin } = useContext(AuthContext);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/customers', {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = (customerId) => {
    setShowDeleteConfirm(customerId);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  const handleDeleteConfirm = async (customerId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      setCustomers(customers.filter(customer => customer.id !== customerId));
      setShowDeleteConfirm(null);
    } catch (err) {
      alert(`Failed to delete customer: ${err.message}`);
      console.error('Error deleting customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="text-blue-500 text-4xl animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 text-red-200 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FaUser className="mr-2 text-blue-400" />
          Customers
        </h2>
        
        {isAdmin() && (
          <Link
            to="/customers/add"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <FaPlus className="mr-2" />
            Add New Customer
          </Link>
        )}
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email or phone..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      {filteredCustomers.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-8 text-center">
          <FaExclamationTriangle className="mx-auto text-yellow-500 text-4xl mb-4" />
          <p className="text-gray-300 mb-2">
            {searchTerm ? 'No customers match your search criteria.' : 'No customers found.'}
          </p>
          {isAdmin() && (
            <Link
              to="/customers/add"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Add Your First Customer
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-600">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaUser className="text-gray-400 mr-2" />
                      <span className="font-medium text-white">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-300">{customer.email || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-300">{customer.phone || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <Link
                        to={`/purchases/customer/${customer.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                        title="View Purchases"
                      >
                        View Purchases
                      </Link>
                      
                      {isAdmin() && (
                        <>
                          <Link
                            to={`/customers/edit/${customer.id}`}
                            className="text-green-400 hover:text-green-300 transition-colors duration-200"
                            title="Edit Customer"
                          >
                            <FaEdit />
                          </Link>
                          
                          <button
                            onClick={() => handleDeleteClick(customer.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                            title="Delete Customer"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                    
                    {showDeleteConfirm === customer.id && (
                      <div className="absolute z-10 mt-2 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                        <p className="text-white mb-4">Are you sure you want to delete this customer?</p>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleDeleteConfirm(customer.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={handleDeleteCancel}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomerManagement; 