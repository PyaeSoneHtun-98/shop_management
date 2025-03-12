import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaExclamationTriangle } from 'react-icons/fa';

function EditPurchase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [paymentType, setPaymentType] = useState('immediate'); // 'immediate' or 'credit'
  
  const [formData, setFormData] = useState({
    customer_id: '',
    buy_date: new Date().toISOString().split('T')[0], // Set default to today
    immediate: true,
    interest_percentage: 0,
    total_amount: '',
    paid_date: ''
  });

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

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
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
        setError(err.message);
        console.error('Error fetching customers:', err);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch purchase data
  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/purchases/${id}`, {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Format dates for form inputs
        const formattedData = {
          ...data,
          buy_date: data.buy_date ? data.buy_date.split('T')[0] : '',
          paid_date: data.paid_date ? data.paid_date.split('T')[0] : ''
        };
        
        setFormData(formattedData);
        
        // Set payment type based on the purchase
        setPaymentType(data.immediate || data.interest_percentage === 0 ? 'immediate' : 'credit');
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching purchase:', err);
        setLoading(false);
      }
    };

    fetchPurchase();
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
      interest_percentage: type === 'immediate' ? 0 : (prev.interest_percentage > 0 ? prev.interest_percentage : 3)
    }));
  };

  const handleInterestPercentageChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setFormData(prev => ({
        ...prev,
        interest_percentage: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Parse the numeric values from text inputs
      const totalAmount = parseFloat(formData.total_amount);
      const interestPercentage = paymentType === 'immediate' ? 0 : parseFloat(formData.interest_percentage);
      
      // Validate numbers
      if (isNaN(totalAmount) || totalAmount <= 0) {
        throw new Error('Please enter a valid principal amount greater than 0');
      }
      
      if (paymentType === 'credit' && (isNaN(interestPercentage) || interestPercentage < 0)) {
        throw new Error('Please enter a valid interest percentage (0 or greater)');
      }
      
      // Update the purchase
      const purchaseData = {
        customer_id: formData.customer_id,
        buy_date: formData.buy_date,
        immediate: paymentType === 'immediate',
        interest_percentage: interestPercentage,
        total_amount: totalAmount,
        paid_date: formData.paid_date // Keep the existing paid_date value
      };
      
      console.log('Submitting updated purchase data:', purchaseData);
      
      const response = await fetch(`http://localhost:5000/api/purchases/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchaseData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      // Redirect to purchases list on success
      navigate('/purchases');
    } catch (err) {
      setError(err.message);
      console.error('Error updating purchase:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate interest amount and total with interest
  const interestAmount = formData.total_amount && formData.interest_percentage 
    ? (parseFloat(formData.total_amount) * parseFloat(formData.interest_percentage) / 100) 
    : 0;
  
  const totalWithInterest = formData.total_amount 
    ? (parseFloat(formData.total_amount) + interestAmount) 
    : 0;

  return (
    <div>
      <div className="mb-6 flex items-center">
        <Link to="/purchases" className="flex items-center text-blue-400 hover:text-blue-300 mr-4">
          <FaArrowLeft className="mr-2" />
          <span>Back to Purchases</span>
        </Link>
        <h2 className="text-2xl font-bold text-white">Edit Purchase #{id}</h2>
      </div>

      {error && (
        <div className="bg-red-900 text-red-200 p-4 rounded-md mb-6 flex items-start">
          <FaExclamationTriangle className="text-red-300 mr-2 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

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
                <label htmlFor="customer_id" className="block text-gray-300 text-sm font-medium mb-2">
                  Customer
                </label>
                <select
                  id="customer_id"
                  name="customer_id"
                  value={formData.customer_id || ''}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
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
                  value={formData.buy_date || ''}
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
                  type="text"
                  id="total_amount"
                  name="total_amount"
                  value={formData.total_amount || ''}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {paymentType === 'credit' && (
                <>
                  <div>
                    <label htmlFor="interest_percentage" className="block text-gray-300 text-sm font-medium mb-2">
                      Interest Percentage (%)
                    </label>
                    <input
                      type="text"
                      id="interest_percentage"
                      name="interest_percentage"
                      value={formData.interest_percentage || 0}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.total_amount && formData.interest_percentage > 0 && (
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
                </>
              )}
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className={`flex items-center justify-center w-full md:w-auto px-6 py-3 rounded-md transition-colors duration-200 ${
                  submitting 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-900 text-green-300 hover:bg-green-800'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-300 mr-2"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    <span>Update Purchase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditPurchase;