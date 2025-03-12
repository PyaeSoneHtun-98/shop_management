import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FaShoppingCart, FaUser, FaCalendarAlt, FaMoneyBillWave, FaEdit, FaArrowLeft, FaPercentage, FaCheckCircle, FaTimesCircle, FaTrash, FaInfoCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, FaDollarSign, FaClock } from 'react-icons/fa';
import apiClient from '../api/apiClient';
import AuthContext from '../contexts/AuthContext';

function PurchaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthContext);
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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
    const fetchPurchase = async () => {
      try {
        console.log('Fetching purchase details with ID:', id);
        console.log('Token from localStorage:', localStorage.getItem('token') ? 'Found' : 'Not found');
        
        setLoading(true);
        console.log('Sending request to:', `http://localhost:5000/api/purchases/${id}`);
        console.log('With headers:', getAuthHeaders());
        
        const response = await fetch(`http://localhost:5000/api/purchases/${id}`, {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          console.error('Error response:', response.statusText);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Purchase data fetched successfully:', data);
        setPurchase(data);
      } catch (err) {
        console.error('Error fetching purchase details:', err);
        setError(`Failed to fetch purchase details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    console.log('PurchaseDetails component mounted with ID:', id);
    fetchPurchase();
    
    // Get current user info
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
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        console.log('Deleting purchase with ID:', id);
        const response = await fetch(`http://localhost:5000/api/purchases/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        navigate('/purchases');
      } catch (err) {
        console.error('Error deleting purchase:', err);
        setError('Failed to delete purchase. Please try again later.');
      }
    }
  };

  const handleMarkAsPaid = async () => {
    if (window.confirm('Are you sure you want to mark this purchase as fully paid?')) {
      try {
        setIsPaying(true);
        setSuccessMessage('');
        
        // Use the apiClient instead of axios directly
        const response = await apiClient.put(`/purchases/${id}/mark-paid`);
        
        // Handle successful response
        console.log('Purchase marked as paid:', response.data);
        
        // Update the local state to reflect the change
        setPurchase({
          ...purchase,
          paid_date: new Date().toISOString().split('T')[0]
        });
        
        setIsPaying(false);
        setSuccessMessage('Purchase has been successfully marked as paid!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (error) {
        console.error('Error marking purchase as paid:', error);
        setError('Failed to mark purchase as paid. Please try again later.');
        setIsPaying(false);
      }
    }
  };

  const calculateRemainingAmount = (total, depositPercentage) => {
    const depositAmount = (total * depositPercentage) / 100;
    return total - depositAmount;
  };

  if (loading) return <div className="text-center py-4 text-gray-200">Loading...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;
  if (!purchase) return <div className="py-4 text-gray-200">Purchase not found.</div>;
  
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

  // Determine if this is a credit purchase
  const isCreditPurchase = purchase.interest_percentage > 0;
  const isPaid = purchase.paid_date !== null;

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-sm">
      <SuccessAlert />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white flex items-center">
          <FaInfoCircle className="mr-2 text-blue-400" />
          Purchase Details
          {purchase.immediate && (
            <span className="ml-3 bg-green-900 text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
              <FaCheckCircle className="mr-1" />
              Fully Paid
            </span>
          )}
        </h2>
        <div className="flex space-x-2">
          {currentUser?.role === 'admin' && (
            <>
              <Link
                to={`/edit/${purchase.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center"
              >
                <FaEdit className="mr-2" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center"
              >
                <FaTrash className="mr-2" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded hover:bg-gray-600 transition-colors duration-200 flex items-center"
          >
            <FaArrowLeft className="mr-2" />
            Back to List
          </button>
        </div>
      </div>

      {/* Credit Purchase Status Banner - Only show for credit purchases */}
      {isCreditPurchase && (
        <div className={`mb-6 p-3 rounded-lg flex justify-between items-center ${isPaid ? 'bg-green-800' : 'bg-yellow-800'}`}>
          <div className="flex items-center">
            {isPaid ? (
              <>
                <FaCheckCircle className="text-green-300 mr-2 text-xl" />
                <span className="text-green-300 font-bold text-lg">PAID</span>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-yellow-300 mr-2 text-xl" />
                <span className="text-yellow-300 font-bold text-lg">UNPAID</span>
              </>
            )}
          </div>
          {isPaid ? (
            <span className="text-green-300">
              Payment received on {purchase.paid_date && format(new Date(purchase.paid_date), 'MMM dd, yyyy')}
            </span>
          ) : isAdmin() ? (
            <button
              onClick={handleMarkAsPaid}
              disabled={isPaying}
              className="px-3 py-1 bg-yellow-700 text-white rounded hover:bg-yellow-600 transition-colors duration-200 text-sm flex items-center"
            >
              {isPaying ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </span>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  Mark as Paid
                </>
              )}
            </button>
          ) : (
            <span className="text-yellow-300">
              Awaiting payment approval
            </span>
          )}
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded shadow border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center text-gray-200">
              <FaUser className="mr-2 text-blue-400" />
              Customer Information
            </h3>
            <p className="mb-1 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200">
                <FaUser className="mr-1 text-gray-400" /> Name:
              </span> 
              {purchase.user_name}
            </p>
            {purchase.user_name && (
              <>
                {purchase.user_email && (
                  <p className="mb-1 flex items-center text-gray-300">
                    <span className="font-medium mr-2 flex items-center text-gray-200">
                      <FaEnvelope className="mr-1 text-gray-400" /> Email:
                    </span> 
                    {purchase.user_email}
                  </p>
                )}
                {purchase.user_phone ? (
                  <p className="mb-1 flex items-center text-gray-300">
                    <span className="font-medium mr-2 flex items-center text-gray-200">
                      <FaPhone className="mr-1 text-gray-400" /> Phone:
                    </span> 
                    {purchase.user_phone}
                  </p>
                ) : null}
                {purchase.user_address ? (
                  <p className="mb-1 flex items-center text-gray-300">
                    <span className="font-medium mr-2 flex items-center text-gray-200">
                      <FaMapMarkerAlt className="mr-1 text-gray-400" /> Address:
                    </span> 
                    {purchase.user_address}
                  </p>
                ) : null}
              </>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center text-gray-200">
              <FaDollarSign className="mr-2 text-blue-400" />
              Purchase Information
            </h3>
            <p className="mb-1 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200"><FaCalendarAlt className="mr-1 text-gray-400" /> Buy Date:</span> 
              {purchase.buy_date}
            </p>
            <p className="mb-1 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200"><FaDollarSign className="mr-1 text-gray-400" /> Total Amount:</span> 
              ${Number(purchase.total_amount).toFixed(2)}
            </p>
            <p className="mb-1 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200"><FaDollarSign className="mr-1 text-gray-400" /> Payment Type:</span> 
              <span className={purchase.immediate ? "text-green-400 font-medium flex items-center" : ""}>
                {isCreditPurchase ? 'Credit Payment' : 'Immediate Payment'}
                {purchase.immediate && <FaCheckCircle className="ml-1 text-green-400" />}
              </span>
            </p>
            {isCreditPurchase && (
              <>
                <p className="mb-1 flex items-center text-gray-300">
                  <span className="font-medium mr-2 flex items-center text-gray-200"><FaPercentage className="mr-1 text-gray-400" /> Interest Rate:</span> 
                  {purchase.interest_percentage}%
                </p>
                {isPaid && (
                  <p className="mb-1 flex items-center text-gray-300">
                    <span className="font-medium mr-2 flex items-center text-gray-200"><FaCalendarAlt className="mr-1 text-gray-400" /> Paid Date:</span> 
                    <span className="text-green-400">{purchase.paid_date && format(new Date(purchase.paid_date), 'MMM dd, yyyy')}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2 flex items-center text-gray-200">
            <FaInfoCircle className="mr-2 text-blue-400" />
            Additional Information
          </h3>
          <p className="mb-1 flex items-center text-gray-300">
            <span className="font-medium mr-2 flex items-center text-gray-200"><FaCalendarAlt className="mr-1 text-gray-400" /> Created At:</span> 
            {purchase.created_at && format(new Date(purchase.created_at), 'MMM dd, yyyy HH:mm:ss')}
          </p>
          {purchase.updated_at && (
            <p className="mb-1 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200"><FaCalendarAlt className="mr-1 text-gray-400" /> Last Updated:</span> 
              {format(new Date(purchase.updated_at), 'MMM dd, yyyy HH:mm:ss')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PurchaseDetails;