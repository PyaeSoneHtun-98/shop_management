import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaExclamationTriangle } from 'react-icons/fa';

function PurchaseForm({ initialData, id }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
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

  // If editing, fetch purchase data
  useEffect(() => {
    if (id) {
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
            customer_id: data.customer_id,
            buy_date: data.buy_date ? data.buy_date.split('T')[0] : '',
            paid_date: data.paid_date ? data.paid_date.split('T')[0] : ''
          };
          
          setFormData(formattedData);
        } catch (err) {
          setError(err.message);
          console.error('Error fetching purchase:', err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPurchase();
    } else if (initialData) {
      // If initialData is provided, use it
      setFormData({
        ...initialData,
        buy_date: initialData.buy_date ? initialData.buy_date.split('T')[0] : new Date().toISOString().split('T')[0],
        paid_date: initialData.paid_date ? initialData.paid_date.split('T')[0] : ''
      });
    }
  }, [id, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const url = id 
        ? `http://localhost:5000/api/purchases/${id}` 
        : 'http://localhost:5000/api/purchases';
      
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
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
      console.error('Error saving purchase:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate interest amount and total with interest
  const interestAmount = formData.total_amount && formData.interest_percentage 
    ? (parseFloat(formData.total_amount) * parseFloat(formData.interest_percentage) / 100) 
    : 0;
  
  const totalWithInterest = formData.total_amount 
    ? (parseFloat(formData.total_amount) + interestAmount) 
    : 0;

  return (
    <div>
      {error && (
        <div className="bg-red-900 text-red-200 p-4 rounded-md mb-6 flex items-start">
          <FaExclamationTriangle className="text-red-300 mr-2 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

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
              type="number"
              id="total_amount"
              name="total_amount"
              value={formData.total_amount || ''}
              onChange={handleChange}
              required
              step="0.01"
              min="0.01"
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Payment Type
            </label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="immediate"
                  checked={formData.immediate}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-300">Immediate Payment</span>
              </label>
            </div>
          </div>

          {!formData.immediate && (
            <>
              <div>
                <label htmlFor="interest_percentage" className="block text-gray-300 text-sm font-medium mb-2">
                  Interest Percentage (%)
                </label>
                <input
                  type="number"
                  id="interest_percentage"
                  name="interest_percentage"
                  value={formData.interest_percentage || 0}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
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

              <div>
                <label htmlFor="paid_date" className="block text-gray-300 text-sm font-medium mb-2">
                  Paid Date (leave empty if unpaid)
                </label>
                <input
                  type="date"
                  id="paid_date"
                  name="paid_date"
                  value={formData.paid_date || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                <span>Save Purchase</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Make sure to export the component as default
export default PurchaseForm; 