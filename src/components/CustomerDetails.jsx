import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { FaUser, FaEdit, FaTrash, FaArrowLeft, FaEnvelope, 
         FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle,
         FaShoppingCart, FaDollarSign, FaPaperclip, FaClock, FaEye, 
         FaTags, FaRegClock, FaHistory, FaUndoAlt, FaPlus, 
         FaFileInvoiceDollar, FaCreditCard, FaPercentage } from 'react-icons/fa';
import { format } from 'date-fns';
import DataTable from 'react-data-table-component';
import Pagination from './Pagination';

function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [customer, setCustomer] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Purchase history state
  const [activeTab, setActiveTab] = useState('immediate'); // 'immediate' or 'credit'
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPaying, setIsPaying] = useState({});

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
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/customers/${id}`, {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized. Please log in again.');
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCustomer(data);
      } catch (err) {
        console.error('Error fetching customer details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCustomerPurchases = async () => {
      try {
        setLoadingPurchases(true);
        const response = await fetch(`http://localhost:5000/api/purchases/customer/${id}`, {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPurchases(data);
      } catch (err) {
        console.error('Error fetching purchases:', err);
        // We don't set the main error here to still show the customer details
      } finally {
        setLoadingPurchases(false);
      }
    };

    fetchCustomerDetails();
    fetchCustomerPurchases();
  }, [id]);

  const handleDelete = async () => {
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
        
        navigate('/customers');
      } catch (err) {
        console.error('Error deleting customer:', err);
        setError('Failed to delete customer. Please try again later.');
      }
    }
  };

  // Handle payment for a purchase
  const handlePayment = async (purchaseId) => {
    if (window.confirm('Mark this purchase as paid?')) {
      try {
        setIsPaying(prev => ({ ...prev, [purchaseId]: true }));
        
        const response = await fetch(`http://localhost:5000/api/purchases/${purchaseId}/mark-as-paid`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${await response.text()}`);
        }
        
        // Update the purchase in the state
        setPurchases(prev => 
          prev.map(purchase => 
            purchase.id === purchaseId 
              ? { ...purchase, paid_date: new Date().toISOString() } 
              : purchase
          )
        );
        
        setIsPaying(prev => ({ ...prev, [purchaseId]: false }));
        setSuccessMessage('Payment has been successfully recorded!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (err) {
        console.error('Error recording payment:', err);
        setError('Failed to record payment. Please try again later.');
        setIsPaying(prev => ({ ...prev, [purchaseId]: false }));
      }
    }
  };

  // Handle undoing a payment
  const handleUndoPayment = async (purchaseId) => {
    if (window.confirm('Are you sure you want to undo this payment?')) {
      try {
        setIsPaying(prev => ({ ...prev, [purchaseId]: true }));
        
        // Use the dedicated endpoint for undoing payments
        const response = await fetch(`http://localhost:5000/api/purchases/${purchaseId}/undo-payment`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${await response.text()}`);
        }
        
        // Update the purchase in the state
        setPurchases(prev => 
          prev.map(purchase => 
            purchase.id === purchaseId 
              ? { ...purchase, paid_date: null } 
              : purchase
          )
        );
        
        setIsPaying(prev => ({ ...prev, [purchaseId]: false }));
        setSuccessMessage('Payment has been successfully undone!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (err) {
        console.error('Error undoing payment:', err);
        setError('Failed to undo payment. Please try again later.');
        setIsPaying(prev => ({ ...prev, [purchaseId]: false }));
      }
    }
  };

  // Filter purchases by type (immediate or credit)
  const filteredPurchases = purchases.filter(purchase => {
    return activeTab === 'immediate' 
      ? purchase.immediate === 1 || purchase.immediate === true
      : purchase.immediate === 0 || purchase.immediate === false;
  });

  // Add these calculation functions at the component level
  const calculateMonthsBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate || new Date());
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    return yearDiff * 12 + monthDiff;
  };

  const calculateInterestAmount = (principal, interestPercentage, buyDate, paidDate) => {
    if (!interestPercentage) return 0;
    
    const months = calculateMonthsBetween(buyDate, paidDate || new Date());
    return (principal * interestPercentage * months) / 100;
  };

  const calculateTotalWithInterest = (principal, interestPercentage, buyDate, paidDate) => {
    const interestAmount = calculateInterestAmount(principal, interestPercentage, buyDate, paidDate);
    return principal + interestAmount;
  };

  // Update credit columns to exactly match PurchaseList structure
  const creditColumns = [
    {
      name: 'Buy Date',
      selector: row => row.buy_date,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaCalendarAlt className="text-gray-400 mr-2" />
          <span>{row.buy_date}</span>
        </div>
      )
    },
    {
      name: 'Principal',
      selector: row => row.total_amount,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaDollarSign className="text-gray-400 mr-2" />
          <span className="font-medium">${Number(row.total_amount).toFixed(2)}</span>
        </div>
      )
    },
    {
      name: 'Months',
      selector: row => calculateMonthsBetween(row.buy_date, row.paid_date || new Date()),
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaClock className="text-gray-400 mr-2" />
          <span>{calculateMonthsBetween(row.buy_date, row.paid_date || new Date()).toFixed(6)}</span>
        </div>
      )
    },
    {
      name: 'Percent',
      selector: row => row.interest_percentage,
      sortable: true,
      width: "100px",
      cell: row => (
        <div className="flex items-center">
          <FaPercentage className="text-gray-400 mr-2" />
          <span>{row.interest_percentage}%</span>
        </div>
      )
    },
    {
      name: 'Interest Amount',
      selector: row => calculateInterestAmount(Number(row.total_amount), row.interest_percentage, row.buy_date, row.paid_date),
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaDollarSign className="text-gray-400 mr-2" />
          <span>${calculateInterestAmount(Number(row.total_amount), row.interest_percentage, row.buy_date, row.paid_date).toFixed(2)}</span>
        </div>
      )
    },
    {
      name: 'Total with Interest',
      selector: row => calculateTotalWithInterest(Number(row.total_amount), row.interest_percentage, row.buy_date, row.paid_date),
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaDollarSign className="text-gray-400 mr-2" />
          <span className="font-medium">${calculateTotalWithInterest(Number(row.total_amount), row.interest_percentage, row.buy_date, row.paid_date).toFixed(2)}</span>
        </div>
      )
    },
    {
      name: 'Status',
      selector: row => row.paid_date ? 'Paid' : 'Unpaid',
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          {row.paid_date ? (
            <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs font-semibold">
              Paid on {row.paid_date}
            </span>
          ) : (
            <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded-full text-xs font-semibold">
              Unpaid
            </span>
          )}
        </div>
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex space-x-3">
          <Link
            to={`/purchases/${row.id}`}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
            title="View Details"
          >
            <FaEye />
          </Link>
          {currentUser?.role === 'admin' && (
            <>
              <Link
                to={`/edit/${row.id}`}
                className="text-green-600 hover:text-green-800 transition-colors duration-200 flex items-center"
                title="Edit Purchase"
              >
                <FaEdit />
              </Link>
              {!row.paid_date ? (
                <button
                  onClick={() => handlePayment(row.id)}
                  disabled={isPaying[row.id]}
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center disabled:opacity-50"
                  title="Mark as Paid"
                >
                  <FaCheckCircle />
                </button>
              ) : (
                <button
                  onClick={() => handleUndoPayment(row.id)}
                  disabled={isPaying[row.id]}
                  className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200 flex items-center disabled:opacity-50"
                  title="Undo Payment"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      )
    }
  ];

  // Update immediate columns to match PurchaseList style
  const immediateColumns = [
    {
      name: 'Buy Date',
      selector: row => row.buy_date,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaCalendarAlt className="text-gray-400 mr-2" />
          <span>{row.buy_date}</span>
        </div>
      )
    },
    {
      name: 'Amount',
      selector: row => row.total_amount,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaDollarSign className="text-gray-400 mr-2" />
          <span className="font-medium">${Number(row.total_amount).toFixed(2)}</span>
        </div>
      )
    },
    {
      name: 'Items',
      selector: row => row.description,
      sortable: true,
      grow: 2,
      cell: row => (
        <div className="flex items-center">
          <FaTags className="text-gray-400 mr-2" />
          <span className="text-gray-300 truncate">{row.description || 'N/A'}</span>
        </div>
      )
    },
    {
      name: 'Type',
      selector: row => 'Cash',
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-semibold">
            <FaShoppingCart className="inline mr-1" /> Cash
          </span>
        </div>
      )
    },
    {
      name: 'Status',
      selector: row => 'Paid',
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs font-semibold">
            <FaCheckCircle className="inline mr-1" /> Paid
          </span>
        </div>
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex space-x-3">
          <Link
            to={`/purchases/${row.id}`}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
            title="View Details"
          >
            <FaEye />
          </Link>
          {currentUser?.role === 'admin' && (
            <>
              <Link
                to={`/edit/${row.id}`}
                className="text-green-600 hover:text-green-800 transition-colors duration-200 flex items-center"
                title="Edit Purchase"
              >
                <FaEdit />
              </Link>
              <button
                onClick={() => handleDelete(row.id)}
                className="text-red-600 hover:text-red-800 transition-colors duration-200 flex items-center"
                title="Delete Purchase"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  // Use the same customStyles as in PurchaseList
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

  // Display a success message
  const SuccessAlert = () => {
    if (!successMessage) return null;
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center" role="alert">
        <FaCheckCircle className="mr-2" />
        <span>{successMessage}</span>
      </div>
    );
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

  if (loading) return (
    <div className="bg-gray-900 p-2 sm:p-6 rounded-lg shadow-sm">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-200">Loading customer details...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-gray-900 p-2 sm:p-6 rounded-lg shadow-sm">
      <ErrorAlert />
      <div className="text-center">
        <Link to="/customers" className="text-blue-400 hover:text-blue-300 inline-flex items-center">
          <FaArrowLeft className="mr-2" />
          Back to Customers
        </Link>
      </div>
    </div>
  );

  if (!customer) return (
    <div className="bg-gray-900 p-2 sm:p-6 rounded-lg shadow-sm">
      <div className="text-center text-gray-200">
        <p>Customer not found.</p>
        <Link to="/customers" className="text-blue-400 hover:text-blue-300 inline-flex items-center mt-4">
          <FaArrowLeft className="mr-2" />
          Back to Customers
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 p-2 sm:p-6 rounded-lg shadow-sm">
      <SuccessAlert />
      <ErrorAlert />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
          <FaUser className="mr-2 text-blue-400" />
          {customer.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          {customer && customer.id && currentUser?.role === 'admin' && (
            <>
              <Link
                to={`/customers/edit/${id}`}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center text-sm sm:text-base"
              >
                <FaEdit className="mr-1 sm:mr-2" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center text-sm sm:text-base"
              >
                <FaTrash className="mr-1 sm:mr-2" />
                Delete
              </button>
            </>
          )}
          <Link
            to="/customers"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200 flex items-center text-sm sm:text-base"
          >
            <FaArrowLeft className="mr-1 sm:mr-2" />
            Back
          </Link>
        </div>
      </div>

      <div className="bg-gray-800 p-4 sm:p-6 rounded shadow border border-gray-700 mb-6 sm:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center text-gray-200">
              <FaUser className="mr-2 text-blue-400" />
              Customer Information
            </h3>
            <p className="mb-2 flex flex-wrap items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaUser className="mr-1 text-gray-400" /> Name:
              </span> 
              <span className="break-all">{customer.name}</span>
            </p>
            <p className="mb-2 flex flex-wrap items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaEnvelope className="mr-1 text-gray-400" /> Email:
              </span> 
              <span className="break-all">{customer.email || 'N/A'}</span>
            </p>
            <p className="mb-2 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaPhone className="mr-1 text-gray-400" /> Phone:
              </span> 
              <span>{customer.phone || 'N/A'}</span>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center text-gray-200">
              <FaMapMarkerAlt className="mr-2 text-blue-400" />
              Address
            </h3>
            <p className="mb-2 text-gray-300">{customer.address || 'No address provided'}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 flex items-center text-gray-300">
            <span className="font-medium mr-2 flex items-center text-gray-200">
              <FaCalendarAlt className="mr-1 text-gray-400" /> Created At:
            </span> 
            <span>{customer.created_at && format(new Date(customer.created_at), 'MMM dd, yyyy HH:mm:ss')}</span>
          </p>
          {customer.updated_at && (
            <p className="mb-2 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaCalendarAlt className="mr-1 text-gray-400" /> Last Updated:
              </span> 
              <span>{format(new Date(customer.updated_at), 'MMM dd, yyyy HH:mm:ss')}</span>
            </p>
          )}
        </div>
      </div>

      {/* Purchase History Section */}
      <div className="bg-gray-800 p-4 rounded shadow border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center text-gray-200">
            <FaHistory className="mr-2 text-blue-400" />
            Purchase History
          </h3>
          
        </div>

        {/* Tabs - match the style from PurchaseList */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'immediate'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('immediate')}
          >
            <FaCheckCircle className="mr-1.5 inline text-xs" />
            Immediate Purchases
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'credit'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('credit')}
          >
            <FaCreditCard className="mr-1.5 inline text-xs" />
            Credit Purchases
          </button>
        </div>

        {loadingPurchases ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-300">Loading purchase history...</span>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-6 text-center text-gray-400">
            <p>No {activeTab} purchases found for this customer.</p>
            <Link
              to={`/add?customer=${id}`}
              className=" mt-3 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center text-sm mx-auto w-max"
            >
              <FaPlus className="mr-1.5" />
              Add New Purchase
            </Link>
          </div>
        ) : (
          <>
            <DataTable
              columns={activeTab === 'immediate' ? immediateColumns : creditColumns}
              data={filteredPurchases.slice(
                (currentPage - 1) * rowsPerPage,
                currentPage * rowsPerPage
              )}
              customStyles={customStyles}
              pointerOnHover
              responsive
              pagination={false}
            />
            
            {/* Custom pagination component */}
            {filteredPurchases.length > rowsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalRows={filteredPurchases.length}
                rowsPerPage={rowsPerPage}
                onChangePage={setCurrentPage}
                onChangeRowsPerPage={setRowsPerPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerDetails;