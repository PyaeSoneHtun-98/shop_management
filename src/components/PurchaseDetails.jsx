import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaArrowLeft, FaUser, FaCalendarAlt, FaDollarSign, FaPercentage, FaClock, FaInfoCircle, FaCheckCircle, FaPhone, FaMapMarkerAlt, FaEnvelope, FaShoppingCart, FaMoneyBillWave, FaTruck } from 'react-icons/fa';

function PurchaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/purchases/${id}`);
        setPurchase(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch purchase details. Please try again later.');
        setLoading(false);
        console.error('Error fetching purchase:', err);
      }
    };

    fetchPurchase();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await axios.delete(`http://localhost:5000/api/purchases/${id}`);
        navigate('/');
      } catch (err) {
        setError('Failed to delete purchase. Please try again later.');
        console.error('Error deleting purchase:', err);
      }
    }
  };

  const handleMarkAsPaid = async () => {
    if (window.confirm('Are you sure you want to mark this purchase as fully paid?')) {
      try {
        setIsPaying(true);
        setSuccessMessage('');
        
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
        
        // Refresh the purchase data
        const response = await axios.get(`http://localhost:5000/api/purchases/${id}`);
        setPurchase(response.data);
        setIsPaying(false);
        setSuccessMessage('Purchase has been successfully marked as paid!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (err) {
        setError('Failed to mark purchase as paid. Please try again later.');
        setIsPaying(false);
        console.error('Error updating purchase:', err);
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

  // Determine if this is a deposit payment
  const isDepositPayment = purchase.payment_type === 'deposit';

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
          <Link
            to="/"
            className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded hover:bg-gray-600 transition-colors duration-200 flex items-center"
          >
            <FaArrowLeft className="mr-2" />
            Back to List
          </Link>
        </div>
      </div>

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
              {format(new Date(purchase.buy_date), 'MMM dd, yyyy')}
            </p>
            <p className="mb-1 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200"><FaDollarSign className="mr-1 text-gray-400" /> Total Amount:</span> 
              ${Number(purchase.total_amount).toFixed(2)}
            </p>
            <p className="mb-1 flex items-center text-gray-300">
              <span className="font-medium mr-2 flex items-center text-gray-200"><FaDollarSign className="mr-1 text-gray-400" /> Payment Type:</span> 
              <span className={purchase.immediate ? "text-green-400 font-medium flex items-center" : ""}>
                {purchase.immediate ? 'Immediate Payment' : 'Deposit Payment'}
                {purchase.immediate && <FaCheckCircle className="ml-1 text-green-400" />}
              </span>
            </p>
            {!purchase.immediate && (
              <>
                <p className="mb-1 flex items-center text-gray-300">
                  <span className="font-medium mr-2 flex items-center text-gray-200"><FaPercentage className="mr-1 text-gray-400" /> Deposit Percentage:</span> 
                  {purchase.deposit_percentage}%
                </p>
                <p className="mb-1 flex items-center text-gray-300">
                  <span className="font-medium mr-2 flex items-center text-gray-200"><FaDollarSign className="mr-1 text-gray-400" /> Deposit Amount:</span> 
                  ${(Number(purchase.total_amount) * purchase.deposit_percentage / 100).toFixed(2)}
                </p>
                <p className="mb-1 flex items-center text-gray-300">
                  <span className="font-medium mr-2 flex items-center text-gray-200"><FaDollarSign className="mr-1 text-gray-400" /> Remaining Amount:</span> 
                  ${calculateRemainingAmount(Number(purchase.total_amount), purchase.deposit_percentage).toFixed(2)}
                </p>
                <p className="mb-1 flex items-center text-gray-300">
                  <span className="font-medium mr-2 flex items-center text-gray-200"><FaClock className="mr-1 text-gray-400" /> Due Date:</span> 
                  {purchase.due_date ? format(new Date(purchase.due_date), 'MMM dd, yyyy') : 'N/A'}
                </p>
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
            {format(new Date(purchase.created_at), 'MMM dd, yyyy HH:mm:ss')}
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