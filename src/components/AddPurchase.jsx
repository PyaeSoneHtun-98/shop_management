import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaCalendarAlt, FaDollarSign, FaPercentage, FaClock, FaSave, FaTimes, FaUserCircle } from 'react-icons/fa';

function AddPurchase() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_id: '',
    buy_date: '',
    deposit_percentage: '0',
    total_amount: '',
    due_date: '',
    immediate: true
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate all required fields
    if (!formData.user_id || !formData.buy_date || formData.total_amount === '') {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate deposit-specific fields
    if (!formData.immediate) {
      if (formData.deposit_percentage === '' || !formData.due_date) {
        setError('Please fill in deposit percentage and due date for deposit payment');
        setLoading(false);
        return;
      }
    }

    try {
      // Convert string values to appropriate types
      const purchaseData = {
        ...formData,
        deposit_percentage: !formData.immediate ? parseFloat(formData.deposit_percentage) : 0,
        total_amount: parseFloat(formData.total_amount),
        payment_status: formData.immediate ? 'completed' : 'pending',
        due_date: !formData.immediate ? formData.due_date : null
      };

      await axios.post('http://localhost:5000/api/purchases', purchaseData);
      setLoading(false);
      navigate('/');
    } catch (err) {
      setError('Failed to add purchase. Please check your inputs and try again.');
      setLoading(false);
      console.error('Error adding purchase:', err);
    }
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white flex items-center">
        <FaDollarSign className="mr-2 text-blue-400" />
        Add New Purchase
      </h2>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="user_id" className="block mb-1 flex items-center text-gray-300">
            <FaUserCircle className="mr-2 text-blue-400" />
            Select User
          </label>
          <select
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
          >
            <option value="">-- Select User --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.address || 'No address'})</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="buy_date" className="block mb-1 flex items-center text-gray-300">
            <FaCalendarAlt className="mr-2 text-blue-400" />
            Buy Date
          </label>
          <input
            type="date"
            id="buy_date"
            name="buy_date"
            value={formData.buy_date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="total_amount" className="block mb-1 flex items-center text-gray-300">
            <FaDollarSign className="mr-2 text-blue-400" />
            Total Amount
          </label>
          <input
            type="number"
            id="total_amount"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 flex items-center text-gray-300">
            <FaDollarSign className="mr-2 text-blue-400" />
            Payment Type
          </label>
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 text-gray-200">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="immediate"
                checked={formData.immediate}
                onChange={(e) => setFormData({ ...formData, immediate: true })}
                className="form-radio h-4 w-4 text-blue-500"
              />
              <span className="ml-2">Immediate Payment</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="immediate"
                checked={!formData.immediate}
                onChange={(e) => setFormData({ ...formData, immediate: false })}
                className="form-radio h-4 w-4 text-blue-500"
              />
              <span className="ml-2">Deposit Payment</span>
            </label>
          </div>
        </div>

        {!formData.immediate && (
          <>
            <div className="mb-4">
              <label htmlFor="deposit_percentage" className="block mb-1 flex items-center text-gray-300">
                <FaPercentage className="mr-2 text-blue-400" />
                Deposit Percentage
              </label>
              <input
                type="number"
                id="deposit_percentage"
                name="deposit_percentage"
                value={formData.deposit_percentage}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="due_date" className="block mb-1 flex items-center text-gray-300">
                <FaClock className="mr-2 text-blue-400" />
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
              />
            </div>
          </>
        )}
        
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
          >
            <FaSave className="mr-2" />
            {loading ? 'Adding...' : 'Add Purchase'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPurchase;