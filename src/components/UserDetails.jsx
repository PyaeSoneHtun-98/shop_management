import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import DataTable from 'react-data-table-component';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaTrash, FaArrowLeft, FaCalendarAlt, FaDollarSign, FaPercentage, FaClock, FaEye, FaCheckCircle, FaShoppingCart, FaShoppingBag } from 'react-icons/fa';
import Pagination from './Pagination';
import { fetchUser, fetchUserPurchases, updatePurchase, deleteUser } from '../utils/api';
import axios from 'axios';

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('immediate'); // 'immediate' or 'credit'

  useEffect(() => {
    const fetchUserAndPurchases = async () => {
      try {
        // Fetch user details using our API utility
        const userData = await fetchUser(id);
        setUser(userData);

        // Fetch user's purchases using our API utility
        const purchasesData = await fetchUserPurchases(id);
        setPurchases(purchasesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(err.displayMessage || 'Failed to fetch user details. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserAndPurchases();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        navigate('/users');
      } catch (err) {
        setError(err.displayMessage || 'Failed to delete user. Please try again later.');
        console.error('Error deleting user:', err);
      }
    }
  };

  // Calculate months between two dates
  const calculateMonthsBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const dayDiff = end.getDate() - start.getDate();
    
    // Calculate total months with decimal for partial months
    let months = yearDiff * 12 + monthDiff;
    
    // Add partial month based on days
    if (dayDiff > 0) {
      const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
      months += dayDiff / daysInMonth;
    } else if (dayDiff < 0) {
      const daysInPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
      months -= Math.abs(dayDiff) / daysInPrevMonth;
    }
    
    // Ensure we don't return negative months
    return Math.max(0, months);
  };

  // Calculate interest amount based on monthly interest rate and elapsed time
  const calculateInterestAmount = (principal, interestPercentage, buyDate, paidDate) => {
    // If the purchase is paid, calculate interest only up to the paid date
    // Otherwise, calculate interest up to today
    const endDate = paidDate ? new Date(paidDate) : new Date();
    
    // Monthly interest rate (3%)
    const monthlyInterestRate = 3;
    
    // Calculate months between purchase date and end date
    const months = calculateMonthsBetween(buyDate, endDate);
    
    // Calculate total interest percentage based on elapsed months
    const totalInterestPercentage = monthlyInterestRate * months;
    
    // Calculate interest amount
    return (principal * totalInterestPercentage) / 100;
  };

  // Calculate total amount with interest
  const calculateTotalWithInterest = (principal, interestPercentage, buyDate, paidDate) => {
    const interestAmount = calculateInterestAmount(principal, interestPercentage, buyDate, paidDate);
    return principal + interestAmount;
  };

  // Filter purchases based on active tab
  const filteredPurchases = purchases.filter(purchase => {
    if (activeTab === 'immediate') {
      // Only show purchases that were immediate from the beginning
      return purchase.immediate === 1 || purchase.immediate === true;
    } else {
      // Show all credit purchases, whether paid or not
      return purchase.interest_percentage > 0;
    }
  });

  // Define columns based on active tab
  const immediateColumns = [
    {
      name: 'Buy Date',
      selector: row => row.buy_date,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaCalendarAlt className="text-gray-400 mr-2" />
          <span>{format(new Date(row.buy_date), 'MMM dd, yyyy')}</span>
        </div>
      )
    },
    {
      name: 'Paid Date',
      selector: row => row.paid_date,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaCalendarAlt className="text-gray-400 mr-2" />
          <span>{row.paid_date ? format(new Date(row.paid_date), 'MMM dd, yyyy') : '-'}</span>
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
      name: 'Actions',
      cell: row => (
        <div className="flex space-x-3">
          <Link
            to={`/purchases/${row.id}`}
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center"
            title="View Details"
          >
            <FaEye />
          </Link>
          <Link
            to={`/edit/${row.id}`}
            className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center"
            title="Edit Purchase"
          >
            <FaEdit />
          </Link>
        </div>
      )
    }
  ];

  const creditColumns = [
    {
      name: 'Buy Date',
      selector: row => row.buy_date,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaCalendarAlt className="text-gray-400 mr-2" />
          <span>{format(new Date(row.buy_date), 'MMM dd, yyyy')}</span>
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
          <span>{calculateMonthsBetween(row.buy_date, row.paid_date || new Date()).toFixed(1)}</span>
        </div>
      )
    },
    {
      name: 'Interest Amount',
      selector: row => calculateInterestAmount(Number(row.total_amount), 3, row.buy_date, row.paid_date),
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaDollarSign className="text-gray-400 mr-2" />
          <span>${calculateInterestAmount(Number(row.total_amount), 3, row.buy_date, row.paid_date).toFixed(2)}</span>
        </div>
      )
    },
    {
      name: 'Total with Interest',
      selector: row => calculateTotalWithInterest(Number(row.total_amount), 3, row.buy_date, row.paid_date),
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaDollarSign className="text-gray-400 mr-2" />
          <span className="font-medium">${calculateTotalWithInterest(Number(row.total_amount), 3, row.buy_date, row.paid_date).toFixed(2)}</span>
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
              Paid on {format(new Date(row.paid_date), 'MMM dd, yyyy')}
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
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center"
            title="View Details"
          >
            <FaEye />
          </Link>
          <Link
            to={`/edit/${row.id}`}
            className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center"
            title="Edit Purchase"
          >
            <FaEdit />
          </Link>
          {!row.paid_date ? (
            <button
              onClick={() => handleMarkAsPaid(row.id)}
              disabled={isPaying[row.id]}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center disabled:opacity-50"
              title="Mark as Paid"
            >
              <FaCheckCircle />
            </button>
          ) : (
            <button
              onClick={() => handleUndoPayment(row.id)}
              disabled={isPaying[row.id]}
              className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200 flex items-center disabled:opacity-50"
              title="Undo Payment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}
        </div>
      )
    }
  ];

  const columns = activeTab === 'immediate' ? immediateColumns : creditColumns;

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#1f2937', // Changed from #f9fafb to dark gray
        borderBottomWidth: '1px',
        borderBottomColor: '#374151', // Darker border color
      },
    },
    headCells: {
      style: {
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        color: '#d1d5db', // Lighter text for dark background
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '0.875rem',
        backgroundColor: '#111827', // Dark background for rows
        '&:hover': {
          backgroundColor: '#1f2937', // Darker hover state
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        color: '#e5e7eb', // Light text color for dark background
      },
    },
    pagination: {
      style: {
        backgroundColor: '#111827', // Dark background for pagination
        color: '#e5e7eb', // Light text color
        borderTopWidth: '1px',
        borderTopColor: '#374151', // Darker border color
      },
      pageButtonsStyle: {
        color: '#ffffff', // Brighter white color for better visibility
        backgroundColor: 'transparent',
        '&:disabled': {
          color: '#6b7280', // Lighter gray for disabled buttons to be more visible
        },
        '&:hover:not(:disabled)': {
          backgroundColor: '#1f2937', // Darker hover state
          color: '#3b82f6', // Blue highlight on hover
        },
        '&:focus': {
          outline: 'none',
          backgroundColor: '#1f2937',
          color: '#3b82f6', // Blue highlight on focus
        },
      },
      // Additional styles for other pagination elements
      selectStyle: {
        color: '#ffffff', // White text for select dropdown
        backgroundColor: '#1f2937', // Darker background for select
        borderColor: '#4b5563', // Adding border color for better visibility
      },
      iconStyle: {
        fill: '#ffffff', // White color for pagination icons
        '&:disabled': {
          fill: '#6b7280', // Lighter gray for disabled icons
        },
        '&:hover:not(:disabled)': {
          fill: '#3b82f6', // Blue highlight on hover
        },
      },
    },
  };

  // Handle marking a purchase as paid
  const handleMarkAsPaid = async (purchaseId) => {
    if (window.confirm('Are you sure you want to mark this purchase as fully paid?')) {
      try {
        setIsPaying(prev => ({ ...prev, [purchaseId]: true }));
        
        // Get the current purchase data
        const response = await axios.get(`http://localhost:5000/api/purchases/${purchaseId}`);
        const purchase = response.data;
        
        // Format dates properly
        const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : null;
        
        // Get today's date for paid_date
        const today = new Date().toISOString().split('T')[0];
        
        // Prepare properly formatted data for the server
        const purchaseData = {
          user_id: purchase.user_id,
          buy_date: formatDate(purchase.buy_date),
          immediate: false, // Keep as credit purchase
          interest_percentage: purchase.interest_percentage, // Keep original interest percentage
          total_amount: parseFloat(purchase.total_amount),
          paid_date: today // Set paid_date to today
        };
        
        // Update the purchase using our API utility
        await updatePurchase(purchaseId, purchaseData);
        
        // Fetch user's purchases again to ensure we have the latest data
        const purchasesData = await fetchUserPurchases(id);
        setPurchases(purchasesData);
        
        setIsPaying(prev => ({ ...prev, [purchaseId]: false }));
        setSuccessMessage('Purchase has been successfully marked as paid!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (err) {
        setError(err.displayMessage || 'Failed to mark purchase as paid. Please try again later.');
        setIsPaying(prev => ({ ...prev, [purchaseId]: false }));
        console.error('Error updating purchase:', err);
      }
    }
  };

  // Handle undoing a payment
  const handleUndoPayment = async (purchaseId) => {
    if (window.confirm('Are you sure you want to undo this payment?')) {
      try {
        setIsPaying(prev => ({ ...prev, [purchaseId]: true }));
        
        // Get the current purchase data
        const response = await axios.get(`http://localhost:5000/api/purchases/${purchaseId}`);
        const purchase = response.data;
        
        // Format dates properly
        const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : null;
        
        // Prepare properly formatted data for the server
        const purchaseData = {
          user_id: purchase.user_id,
          buy_date: formatDate(purchase.buy_date),
          immediate: false, // Keep as credit purchase
          interest_percentage: purchase.interest_percentage, // Keep original interest percentage
          total_amount: parseFloat(purchase.total_amount),
          paid_date: null // Remove paid_date
        };
        
        // Update the purchase using our API utility
        await updatePurchase(purchaseId, purchaseData);
        
        // Fetch user's purchases again to ensure we have the latest data
        const purchasesData = await fetchUserPurchases(id);
        setPurchases(purchasesData);
        
        setIsPaying(prev => ({ ...prev, [purchaseId]: false }));
        setSuccessMessage('Payment has been successfully undone!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (err) {
        setError(err.displayMessage || 'Failed to undo payment. Please try again later.');
        setIsPaying(prev => ({ ...prev, [purchaseId]: false }));
        console.error('Error updating purchase:', err);
      }
    }
  };

  // Display a success message when the purchase is marked as paid
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
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-200">Loading user details...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <ErrorAlert />
      <div className="flex justify-center">
        <Link
          to="/users"
          className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded hover:bg-gray-600 transition-colors duration-200 flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Back to Users
        </Link>
      </div>
    </div>
  );

  if (!user) return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">User Not Found</h2>
        <p className="text-gray-400 mb-6">The user you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/users"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 inline-flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Back to Users
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <SuccessAlert />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
          <FaUser className="mr-2 text-blue-400" />
          {user.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/users/edit/${id}`}
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
          <Link
            to="/users"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded hover:bg-gray-600 transition-colors duration-200 flex items-center text-sm sm:text-base"
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
              Personal Information
            </h3>
            <p className="mb-2 flex flex-wrap items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaUser className="mr-1 text-gray-400" /> Name:
              </span> 
              <span className="break-all">{user.name}</span>
            </p>
            <p className="mb-2 flex flex-wrap items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaEnvelope className="mr-1 text-gray-400" /> Email:
              </span> 
              <span className="break-all">{user.email}</span>
            </p>
            <p className="mb-2 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaPhone className="mr-1 text-gray-400" /> Phone:
              </span> 
              <span>{user.phone || 'N/A'}</span>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center text-gray-200">
              <FaMapMarkerAlt className="mr-2 text-blue-400" />
              Address
            </h3>
            <p className="mb-2 text-gray-300">{user.address || 'No address provided'}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 flex items-center text-gray-300">
            <span className="font-medium mr-2 flex items-center text-gray-200">
              <FaCalendarAlt className="mr-1 text-gray-400" /> Created At:
            </span> 
            <span>{user.created_at && format(new Date(user.created_at), 'MMM dd, yyyy HH:mm:ss')}</span>
          </p>
          {user.updated_at && (
            <p className="mb-2 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaCalendarAlt className="mr-1 text-gray-400" /> Last Updated:
              </span> 
              <span>{format(new Date(user.updated_at), 'MMM dd, yyyy HH:mm:ss')}</span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded shadow border border-gray-700">
        <h3 className="text-lg font-medium mb-4 flex items-center text-gray-200">
          <FaShoppingBag className="mr-2 text-blue-400" />
          Purchase History
        </h3>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'immediate'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('immediate')}
          >
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
            Credit Purchases
          </button>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
            <p>No {activeTab} purchases found for this user.</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
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
            <Pagination
              currentPage={currentPage}
              totalRows={filteredPurchases.length}
              rowsPerPage={rowsPerPage}
              onChangePage={setCurrentPage}
              onChangeRowsPerPage={setRowsPerPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default UserDetails;