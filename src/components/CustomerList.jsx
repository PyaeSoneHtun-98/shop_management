import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { FaEye, FaEdit, FaTrash, FaUser, FaPhone, FaPlus, FaSearch, FaFileExcel, FaEnvelope, FaMapMarkedAlt } from 'react-icons/fa';
import { MdEmail } from "react-icons/md";
import { CiLocationOn } from "react-icons/ci";
import Pagination from './Pagination';
import * as XLSX from 'xlsx';

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState(null);

  // Add auth headers function
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

  useEffect(() => {
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
        console.error('Error fetching customers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchCurrentUser = () => {
      try {
        const userString = localStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/customers/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        setCustomers(customers.filter(customer => customer.id !== id));
      } catch (err) {
        setError('Failed to delete customer. Please try again later.');
        console.error('Error deleting customer:', err);
      }
    }
  };

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = customers.map(customer => ({
      'Name': customer.name,
      'Email': customer.email || '-',
      'Phone': customer.phone || '-',
      'Address': customer.address || '-'
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'customer_list.xlsx');
  };

  const filteredCustomers = customers.filter(customer => {
    return customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.address?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Updated columns to match PurchaseList style
  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="py-1">
          <div className="font-medium text-white">{row.name}</div>
        </div>
      )
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      cell: row => (
        <div className="flex items-center space-x-1 text-gray-300">
          <MdEmail className="text-blue-400" />
          <span>{row.email || 'N/A'}</span>
        </div>
      )
    },
    {
      name: 'Phone',
      selector: row => row.phone,
      sortable: true,
      cell: row => (
        <div className="flex items-center space-x-1 text-gray-300">
          <FaPhone className="text-green-400" />
          <span>{row.phone || 'N/A'}</span>
        </div>
      )
    },
    {
      name: 'Address',
      selector: row => row.address,
      sortable: true,
      grow: 2,
      cell: row => (
        <div className="flex items-start space-x-1 text-gray-300">
          <CiLocationOn className="text-red-400 mt-1 flex-shrink-0" />
          <span className="truncate">{row.address || 'N/A'}</span>
        </div>
      )
    },
    {
      name: 'Actions',
      cell: row => {
        // Always show view button, but hide edit/delete for non-admins
        // Fix: Ensure admin users can see all action icons
        // Check both role property and string comparison
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === "admin");
        
        return (
          <div className="flex space-x-3">
            <Link
              to={`/customers/${row.id}`}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
              title="View Details"
            >
              <FaEye />
            </Link>
            
            {isAdmin && (
              <>
                <Link
                  to={`/customers/edit/${row.id}`}
                  className="text-green-600 hover:text-green-800 transition-colors duration-200 flex items-center"
                  title="Edit Customer"
                >
                  <FaEdit />
                </Link>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="text-red-600 hover:text-red-800 transition-colors duration-200 flex items-center"
                  title="Delete Customer"
                >
                  <FaTrash />
                </button>
              </>
            )}
          </div>
        );
      },
      button: true,
      width: '120px',
    }
  ];

  // DataTable styles matching PurchaseList
  const customStyles = {
    table: {
      style: {
        backgroundColor: '#111827',
        color: '#e5e7eb',
      },
    },
    tableWrapper: {
      style: {
        borderRadius: '0.375rem',
        overflow: 'hidden',
        border: '1px solid #374151',
      },
    },
    header: {
      style: {
        backgroundColor: '#111827',
        color: '#e5e7eb',
        minHeight: '56px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#1f2937',
        borderBottomWidth: '1px',
        borderBottomColor: '#374151',
      },
    },
    headCells: {
      style: {
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        color: '#d1d5db',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '0.875rem',
        backgroundColor: '#111827',
        '&:hover': {
          backgroundColor: '#1f2937',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        color: '#e5e7eb',
      },
    },
    pagination: {
      style: {
        backgroundColor: '#111827',
        color: '#e5e7eb',
        borderTopWidth: '1px',
        borderTopColor: '#374151',
      },
    },
  };

  // Display a retry button when there's an error
  const ErrorAlert = () => {
    if (!error) return null;
    return (
      <div className="bg-red-900 border border-red-800 text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          <span className="font-medium">{error}</span>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-800 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-sm inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Retry
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <ErrorAlert />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
          <FaUser className="mr-2 text-blue-400" /> 
          Customers
        </h2>
        <div className="flex flex-wrap gap-2">
          {currentUser && (currentUser.role === 'admin' || currentUser.role === "admin") && (
            <Link
              to="/customers/add"
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center text-sm sm:text-base"
            >
              <FaPlus className="mr-1 sm:mr-2" />
              Add Customer
            </Link>
          )}
          <button
            onClick={handleExportToExcel}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm sm:text-base"
            title="Export to Excel"
          >
            <FaFileExcel className="mr-1 sm:mr-2" />
            Export
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-gray-700 focus:border-gray-600 focus:ring-0 focus:text-gray-200 sm:text-sm"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-200">Loading customers...</span>
        </div>
      ) : customers.length === 0 ? (
        <div className="py-8 text-center bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300">No customers found. Add a new customer to get started.</p>
          <Link
            to="/customers/add"
            className=" mt-3 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center text-sm mx-auto w-max"
          >
            <FaPlus className="mr-1.5" />
            Add New Customer
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredCustomers.slice(
              (currentPage - 1) * rowsPerPage,
              currentPage * rowsPerPage
            )}
            customStyles={customStyles}
            pointerOnHover
            responsive
            noHeader
            pagination={false}
          />
          
          {/* Custom pagination component */}
          {filteredCustomers.length > rowsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalRows={filteredCustomers.length}
              rowsPerPage={rowsPerPage}
              onChangePage={setCurrentPage}
              onChangeRowsPerPage={setRowsPerPage}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerList;