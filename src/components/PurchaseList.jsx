import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import DataTable from 'react-data-table-component';
import { FaEye, FaCheckCircle, FaEdit, FaTrash, FaCalendarAlt, FaDollarSign, FaPercentage, FaUser, FaClock, FaPlus, FaSearch, FaFileExcel } from 'react-icons/fa';
import Pagination from './Pagination';
import * as XLSX from 'xlsx';

function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isPaying, setIsPaying] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('immediate'); // 'immediate' or 'credit'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/purchases');
        setPurchases(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch purchases. Please try again later.');
        setLoading(false);
        console.error('Error fetching purchases:', err);
      }
    };

    fetchPurchases();
    
    // Set up an interval to refresh the purchase list every 5 seconds
    const intervalId = setInterval(fetchPurchases, 5000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await axios.delete(`http://localhost:5000/api/purchases/${id}`);
        setPurchases(purchases.filter(purchase => purchase.id !== id));
      } catch (err) {
        setError('Failed to delete purchase. Please try again later.');
        console.error('Error deleting purchase:', err);
      }
    }
  };

  const calculateMonthsBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Implement DAYS360 algorithm (30/360 day count convention)
    const days360 = (startDate, endDate) => {
      let startDay = startDate.getDate();
      let startMonth = startDate.getMonth();
      let startYear = startDate.getFullYear();
      
      let endDay = endDate.getDate();
      let endMonth = endDate.getMonth();
      let endYear = endDate.getFullYear();
      
      // Adjust start day
      if (startDay === 31) {
        startDay = 30;
      }
      
      // Adjust end day
      if (endDay === 31) {
        endDay = 30;
      }
      
      // Calculate using 30/360 formula
      return (endYear - startYear) * 360 + (endMonth - startMonth) * 30 + (endDay - startDay);
    };
    
    const totalDays = days360(start, end);
    const months = totalDays / 30;
    
    console.log('Date Calculation:', {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalDays,
      months
    });
    
    return months;
  };

  // Calculate interest amount based on monthly interest rate and elapsed time
  // Calculate interest amount based on monthly interest rate and elapsed time
  const calculateInterestAmount = (principal, interestPercentage, buyDate, paidDate) => {
    // If the purchase is paid, calculate interest only up to the paid date
    // Otherwise, calculate interest up to today
    const endDate = paidDate ? new Date(paidDate) : new Date();
    
    // Calculate months between purchase date and end date
    const months = calculateMonthsBetween(buyDate, endDate);
    
    // Calculate monthly interest amount (fixed)
    const monthlyInterestAmount = (principal * interestPercentage) / 100;
    
    // Total interest = monthly interest × number of months
    return monthlyInterestAmount * months;
  };

  // Calculate total amount with interest
  const calculateTotalWithInterest = (principal, interestPercentage, buyDate, paidDate) => {
    const interestAmount = calculateInterestAmount(principal, interestPercentage, buyDate, paidDate);
    return principal + interestAmount;
  };

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredPurchases.map(purchase => {
      if (activeTab === 'immediate') {
        return {
          'Customer': purchase.user_name,
          'Buy Date': purchase.buy_date ? format(new Date(purchase.buy_date), 'MMM dd, yyyy') : '-',
          'Paid Date': purchase.paid_date ? format(new Date(purchase.paid_date), 'MMM dd, yyyy') : '-',
          'Amount': `$${Number(purchase.total_amount).toFixed(2)}`
        };
      } else {
        const principal = Number(purchase.total_amount);
        const months = calculateMonthsBetween(purchase.buy_date, purchase.paid_date || new Date());
        const interestAmount = calculateInterestAmount(principal, 3, purchase.buy_date, purchase.paid_date);
        const totalWithInterest = calculateTotalWithInterest(principal, 3, purchase.buy_date, purchase.paid_date);
        
        return {
          'Customer': purchase.user_name,
          'Buy Date': purchase.buy_date ? format(new Date(purchase.buy_date), 'MMM dd, yyyy') : '-',
          'Principal Amount': `$${principal.toFixed(2)}`,
          'Months': months.toFixed(1),
          'Monthly Rate': '3%',
          'Interest Amount': `$${interestAmount.toFixed(2)}`,
          'Total with Interest': `$${totalWithInterest.toFixed(2)}`,
          'Status': purchase.paid_date ? `Paid on ${format(new Date(purchase.paid_date), 'MMM dd, yyyy')}` : 'Unpaid'
        };
      }
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'immediate' ? 'Immediate Purchases' : 'Credit Purchases');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, activeTab === 'immediate' ? 'immediate_purchases.xlsx' : 'credit_purchases.xlsx');
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;

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
      name: 'Customer',
      selector: row => row.user_name,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaUser className="text-gray-400 mr-2" />
          <span className="font-medium">{row.user_name}</span>
        </div>
      )
    },
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
    // {
    //   name: 'Paid Date',
    //   selector: row => row.paid_date,
    //   sortable: true,
    //   cell: row => (
    //     <div className="flex items-center">
    //       <FaCalendarAlt className="text-gray-400 mr-2" />
    //       <span>{row.paid_date ? format(new Date(row.paid_date), 'MMM dd, yyyy') : '-'}</span>
    //     </div>
    //   )
    // },
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
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
            title="View Details"
          >
            <FaEye />
          </Link>
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
        </div>
      )
    }
  ];

  const creditColumns = [
    {
      name: 'Customer',
      selector: row => row.user_name,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaUser className="text-gray-400 mr-2" />
          <span className="font-medium">{row.user_name}</span>
        </div>
      )
    },
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
            <span>{calculateMonthsBetween(row.buy_date, row.paid_date || new Date()).toFixed(6)}</span>
          </div>
        )
      },
    {
      name: 'Percent',
      selector: row => 3, // Fixed 3% monthly rate
      sortable: false,
      width: "100px",
      cell: row => (
        <div className="flex items-center">
          <FaPercentage className="text-gray-400 mr-2" />
          <span>3%</span>
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
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
            title="View Details"
          >
            <FaEye />
          </Link>
          <Link
            to={`/edit/${row.id}`}
            className="text-green-600 hover:text-green-800 transition-colors duration-200 flex items-center"
            title="Edit Purchase"
          >
            <FaEdit />
          </Link>
          {!row.paid_date ? (
            <button
              onClick={() => handleMarkAsPaid(row.id)}
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
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800 transition-colors duration-200 flex items-center"
            title="Delete Purchase"
          >
            <FaTrash />
          </button>
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
  const handleMarkAsPaid = async (id) => {
    if (window.confirm('Are you sure you want to mark this purchase as fully paid?')) {
      try {
        setIsPaying(prev => ({ ...prev, [id]: true }));
        
        // Get the current purchase data
        const response = await axios.get(`http://localhost:5000/api/purchases/${id}`);
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
        
        // Update the purchase
        await axios.put(`http://localhost:5000/api/purchases/${id}`, purchaseData);
        
        // Fetch all purchases again to ensure we have the latest data from the server
        const updatedPurchasesResponse = await axios.get('http://localhost:5000/api/purchases');
        setPurchases(updatedPurchasesResponse.data);
        
        setIsPaying(prev => ({ ...prev, [id]: false }));
        setSuccessMessage('Purchase has been successfully marked as paid!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (err) {
        setError('Failed to mark purchase as paid. Please try again later.');
        setIsPaying(prev => ({ ...prev, [id]: false }));
        console.error('Error updating purchase:', err);
      }
    }
  };

  // Handle undoing a payment
  const handleUndoPayment = async (id) => {
    if (window.confirm('Are you sure you want to undo this payment?')) {
      try {
        setIsPaying(prev => ({ ...prev, [id]: true }));
        
        // Get the current purchase data
        const response = await axios.get(`http://localhost:5000/api/purchases/${id}`);
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
        
        // Update the purchase
        await axios.put(`http://localhost:5000/api/purchases/${id}`, purchaseData);
        
        // Fetch all purchases again to ensure we have the latest data from the server
        const updatedPurchasesResponse = await axios.get('http://localhost:5000/api/purchases');
        setPurchases(updatedPurchasesResponse.data);
        
        setIsPaying(prev => ({ ...prev, [id]: false }));
        setSuccessMessage('Payment has been successfully undone!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (err) {
        setError('Failed to undo payment. Please try again later.');
        setIsPaying(prev => ({ ...prev, [id]: false }));
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

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <SuccessAlert />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
            <FaDollarSign className="mr-2 text-blue-400" />
            Purchase History
          </h2>
        </div>
        <Link
          to="/add"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center w-full sm:w-auto justify-center"
        >
          <FaPlus className="mr-2" />
          Add New Purchase
        </Link>
      </div>
    
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
        <div className="w-full sm:flex-1 min-w-[200px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
    
        <div className="w-full sm:w-[200px]">
          <select
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">All Months</option>
            <option value="0">January</option>
            <option value="1">February</option>
            <option value="2">March</option>
            <option value="3">April</option>
            <option value="4">May</option>
            <option value="5">June</option>
            <option value="6">July</option>
            <option value="7">August</option>
            <option value="8">September</option>
            <option value="9">October</option>
            <option value="10">November</option>
            <option value="11">December</option>
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <button
            onClick={handleExportToExcel}
            className="w-full px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors duration-200 flex items-center justify-center"
            title="Export to Excel"
          >
            <FaFileExcel className="mr-2" />
            Export to Excel
          </button>
        </div>
      </div>
      
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
        <div className="py-8 text-center bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300">No {activeTab} purchases found. Add a new purchase to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredPurchases.slice(
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
          <Pagination
            currentPage={currentPage}
            totalRows={filteredPurchases.length}
            rowsPerPage={rowsPerPage}
            onChangePage={setCurrentPage}
            onChangeRowsPerPage={setRowsPerPage}
          />
        </div>
      )}
    </div>
  );
}

export default PurchaseList;