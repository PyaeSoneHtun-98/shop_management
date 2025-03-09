import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import DataTable from 'react-data-table-component';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaTrash, FaArrowLeft, FaCalendarAlt, FaDollarSign, FaPercentage, FaClock, FaEye, FaCheckCircle, FaShoppingCart } from 'react-icons/fa';
import Pagination from './Pagination';

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

  useEffect(() => {
    const fetchUserAndPurchases = async () => {
      try {
        // Fetch user details
        const userResponse = await axios.get(`http://localhost:5000/api/users/${id}`);
        setUser(userResponse.data);

        // Fetch user's purchases
        const purchasesResponse = await axios.get(`http://localhost:5000/api/users/${id}/purchases`);
        setPurchases(purchasesResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch user details. Please try again later.');
        setLoading(false);
        console.error('Error fetching user details:', err);
      }
    };

    fetchUserAndPurchases();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        navigate('/users');
      } catch (err) {
        setError('Failed to delete user. Please try again later.');
        console.error('Error deleting user:', err);
      }
    }
  };

  const calculateRemainingAmount = (total, depositPercentage) => {
    const depositAmount = (total * depositPercentage) / 100;
    return total - depositAmount;
  };

  const columns = [
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
          <span className={row.immediate ? "font-medium text-green-400" : "text-red-400"}>
            {row.immediate ? 'Paid' : 'Deposit'}
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
          {!row.immediate && (
            <button
              onClick={() => handleMarkAsPaid(row.id)}
              disabled={isPaying[row.id]}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center disabled:opacity-50"
              title="Mark as Paid"
            >
              <FaCheckCircle />
            </button>
          )}
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
        
        // Fetch user's purchases again to ensure we have the latest data
        const purchasesResponse = await axios.get(`http://localhost:5000/api/users/${user.id}/purchases`);
        setPurchases(purchasesResponse.data);
        
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

  if (loading) return <div className="text-center py-4 text-gray-200">Loading...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;
  if (!user) return <div className="py-4 text-gray-200">User not found.</div>;

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
          <FaShoppingCart className="mr-2 text-blue-400" />
          Purchase History
        </h3>

        {purchases.length === 0 ? (
          <div className="py-8 text-center bg-gray-700 rounded-lg border border-gray-600">
            <p className="text-gray-300">No purchase history found for this user.</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={purchases.slice(
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
              totalRows={purchases.length}
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