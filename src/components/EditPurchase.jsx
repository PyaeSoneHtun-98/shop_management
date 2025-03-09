import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

function EditPurchase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentType, setPaymentType] = useState('immediate'); // 'immediate' or 'credit'
  
  const [formData, setFormData] = useState({
    user_id: '',
    buy_date: '',
    immediate: true,
    interest_percentage: 0,
    total_amount: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [purchaseResponse, usersResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/purchases/${id}`),
          axios.get('http://localhost:5000/api/users')
        ]);
        
        const purchase = purchaseResponse.data;
        
        // Determine payment type from purchase data
        const type = purchase.immediate ? 'immediate' : 'credit';
        
        setPaymentType(type);
        
        // Format dates for form inputs
        const formatDateForInput = (dateStr) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        };
        
        setFormData({
          user_id: purchase.user_id.toString(),
          buy_date: formatDateForInput(purchase.buy_date),
          immediate: purchase.immediate,
          interest_percentage: purchase.interest_percentage || purchase.deposit_percentage || 0,
          total_amount: purchase.total_amount.toString()
        });
        
        setUsers(usersResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load purchase data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    
    setFormData(prev => ({
      ...prev,
      immediate: type === 'immediate',
      interest_percentage: type === 'immediate' ? 0 : (prev.interest_percentage || 10)
    }));
  };

  const handleInterestPercentageChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 0 && value <= 100) {
      setFormData(prev => ({
        ...prev,
        interest_percentage: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Format dates properly
      const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : null;
      
      // Prepare data for submission
      const purchaseData = {
        user_id: formData.user_id,
        buy_date: formatDate(formData.buy_date),
        immediate: paymentType === 'immediate',
        interest_percentage: paymentType === 'immediate' ? 0 : formData.interest_percentage,
        total_amount: parseFloat(formData.total_amount)
      };
      
      await axios.put(`http://localhost:5000/api/purchases/${id}`, purchaseData);
      navigate('/');
    } catch (err) {
      console.error('Error updating purchase:', err);
      setError('Failed to update purchase. Please check your inputs and try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 text-red-200 p-4 rounded-md">
        <p>{error}</p>
        <Link to="/" className="text-red-300 hover:text-red-100 underline mt-2 inline-block">
          Back to Purchases
        </Link>
      </div>
    );
  }

  // Calculate interest amount and total with interest
  const interestAmount = formData.total_amount ? (parseFloat(formData.total_amount) * formData.interest_percentage / 100) : 0;
  const totalWithInterest = formData.total_amount ? (parseFloat(formData.total_amount) + interestAmount) : 0;

  return (
    <div>
      <div className="mb-6 flex items-center">
        <Link to="/" className="flex items-center text-blue-400 hover:text-blue-300 mr-4">
          <FaArrowLeft className="mr-2" />
          <span>Back to Purchases</span>
        </Link>
        <h2 className="text-2xl font-bold text-white">Edit Purchase #{id}</h2>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          {/* Payment Type Selection */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Payment Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                className={`px-4 py-2 rounded-md ${
                  paymentType === 'immediate'
                    ? 'bg-blue-900 text-blue-300'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => handlePaymentTypeChange('immediate')}
              >
                Immediate Payment
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md ${
                  paymentType === 'credit'
                    ? 'bg-purple-900 text-purple-300'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => handlePaymentTypeChange('credit')}
              >
                Credit Payment
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="user_id" className="block text-gray-300 text-sm font-medium mb-2">
                  Customer
                </label>
                <select
                  id="user_id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a customer</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="buy_date" className="block text-gray-300 text-sm font-medium mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  id="buy_date"
                  name="buy_date"
                  value={formData.buy_date}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="total_amount" className="block text-gray-300 text-sm font-medium mb-2">
                  Principal Amount
                </label>
                <input
                  type="number"
                  id="total_amount"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {paymentType === 'credit' && (
                <div>
                  <label htmlFor="interest_percentage" className="block text-gray-300 text-sm font-medium mb-2">
                    Interest Percentage (%)
                  </label>
                  <input
                    type="number"
                    id="interest_percentage"
                    name="interest_percentage"
                    value={formData.interest_percentage}
                    onChange={handleInterestPercentageChange}
                    required
                    min="0"
                    max="100"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.total_amount && (
                    <div className="mt-2 p-2 bg-gray-700 rounded border border-gray-600">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">Interest amount:</span> ${interestAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-300 mt-1">
                        <span className="font-medium">Total with interest:</span> ${totalWithInterest.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-yellow-900 text-yellow-300 rounded-md hover:bg-yellow-800 transition-colors duration-200"
              >
                <FaSave className="mr-2" />
                <span>Update Purchase</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditPurchase;