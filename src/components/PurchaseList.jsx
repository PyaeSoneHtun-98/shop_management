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

  const calculateRemainingAmount = (total, depositPercentage) => {
    const depositAmount = (total * depositPercentage) / 100;
    return total - depositAmount;
  };

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredPurchases.map(purchase => ({
      'Customer': purchase.user_name,
      'Buy Date': purchase.buy_date ? format(new Date(purchase.buy_date), 'MMM dd, yyyy') : '-',
      'Due Date': purchase.due_date ? format(new Date(purchase.due_date), 'MMM dd, yyyy') : '-',
      'Total Amount': `$${Number(purchase.total_amount).toFixed(2)}`,
      'Payment Method': purchase.immediate ? 'Paid' : 'Deposit',
      'Deposit %': purchase.immediate ? '-' : `${purchase.deposit_percentage}%`,
      'Remaining': purchase.immediate ? '-' : `$${calculateRemainingAmount(Number(purchase.total_amount), purchase.deposit_percentage).toFixed(2)}`
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchases');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'purchase_list.xlsx');
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;

  const columns = [
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
      name: 'Due Date',
      selector: row => row.due_date,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaClock className="text-gray-400 mr-2" />
          <span>{row.due_date ? format(new Date(row.due_date), 'MMM dd, yyyy') : '-'}</span>
        </div>
      )
    },
    {
      name: 'Total Amount',
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
      name: 'Payment Method',
      selector: row => row.immediate,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaCheckCircle className={row.immediate ? "text-green-500 mr-2" : "text-red-500 mr-2"} />
          <span className={row.immediate ? "font-medium text-green-600" : "text-red-500"}>
            {row.immediate ? 'Paid' : 'Deposit'}
            {/* {row.immediate && <FaCheckCircle className="ml-1 text-green-500" />} */}
          </span>
        </div>
      )
    },
    {
      name: 'Deposit %',
      selector: row => row.deposit_percentage,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaPercentage className="text-gray-400 mr-2" />
          <span>{row.immediate ? '-' : `${row.deposit_percentage}%`}</span>
        </div>
      )
    },
    {
      name: 'Remaining',
      selector: row => calculateRemainingAmount(Number(row.total_amount), row.deposit_percentage),
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaDollarSign className="text-gray-400 mr-2" />
          <span>{row.immediate ? '-' : `$${calculateRemainingAmount(Number(row.total_amount), row.deposit_percentage).toFixed(2)}`}</span>
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
          {!row.immediate && (
            <button
              onClick={() => handleMarkAsPaid(row.id)}
              disabled={isPaying[row.id]}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center disabled:opacity-50"
              title="Mark as Paid"
            >
              <FaCheckCircle />
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
      // Additional styles for pagination elements
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

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.user_name ? purchase.user_name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesMonth = !selectedMonth || new Date(purchase.buy_date).getMonth() === parseInt(selectedMonth);
    const matchesType = filterType === 'all' || 
      (filterType === 'immediate' && purchase.immediate) || 
      (filterType === 'deposit' && !purchase.immediate);
    return matchesSearch && matchesMonth && matchesType;
  });

  const handleMarkAsPaid = async (id) => {
    if (window.confirm('Are you sure you want to mark this purchase as fully paid?')) {
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
          immediate: true, // Set to immediate payment
          deposit_percentage: 0, // Set deposit to 0
          total_amount: parseFloat(purchase.total_amount),
          due_date: null // No due date needed for immediate payment
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
    
        <div className="w-full sm:w-[200px]">
          <select
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Payment Types</option>
            <option value="immediate">Immediate</option>
            <option value="deposit">Deposit</option>
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
      
      {purchases.length === 0 ? (
        <div className="py-8 text-center bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300">No purchases found. Add a new purchase to get started.</p>
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