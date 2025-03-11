import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FaShoppingCart, FaUser, FaCalendarAlt, FaMoneyBillWave, FaEdit, FaArrowLeft, FaPercentage, FaCheckCircle, FaTimesCircle, FaTrash, FaInfoCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, FaDollarSign, FaClock } from 'react-icons/fa';

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

        // Get today's date for paid_date
        const today = new Date().toISOString().split('T')[0];

        // Prepare properly formatted data for the server
        const purchaseData = {
          user_id: purchase.user_id,
          buy_date: purchase.buy_date,
          immediate: false,
          interest_percentage: purchase.interest_percentage,
          total_amount: parseFloat(purchase.total_amount),
          paid_date: today
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

  // Determine if this is a credit purchase
  const isCreditPurchase = purchase.interest_percentage > 0;
  const isPaid = purchase.paid_date !== null;

  return (
    <div className="bg-gray-900 p-2 md:p-6 rounded-lg shadow-sm">
      <SuccessAlert />
      <div className="flex flex-col justify-between mb-6 gap-4">
      <Link
          to="/"
          className="px-4 py-2 w-fit bg-gray-700 text-gray-200 border border-gray-600 rounded hover:bg-gray-600 transition-colors duration-200 flex items-center"
          title="Back to List"
        >
          <FaArrowLeft className="mr-2 md:mr-2" />
          <span className="hidden md:inline">Back to List</span>
        </Link>
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
        {/* <div className="flex space-x-2">
          <Link
            to={`/edit/${purchase.id}`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center"
            title="Edit Purchase"
          >
            <FaEdit className="mr-2 md:mr-2" />
            <span className="hidden md:inline">Edit</span>
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center"
            title="Delete Purchase"
          >
            <FaTrash className="mr-2 md:mr-2" />
            <span className="hidden md:inline">Delete</span>
          </button>
        </div> */}
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
              Payment received on {purchase.paid_date}
            </span>
          ) : (
            <button
              onClick={handleMarkAsPaid}
              disabled={isPaying}
              className="px-3 py-1 bg-yellow-700 text-white rounded hover:bg-yellow-600 transition-colors duration-200 text-sm flex items-center"
              title="Mark as Paid"
            >
              {isPaying ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  <span className="hidden md:inline">Processing...</span>
                  <span className="md:hidden">...</span>
                </span>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  <span className="hidden md:inline">Mark as Paid</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="bg-gray-800 px-3 py-4 md:p-6 rounded shadow border border-gray-700">
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
                    <span className="text-green-400">{purchase.paid_date}</span>
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