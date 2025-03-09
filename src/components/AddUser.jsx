import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSave, FaTimes } from 'react-icons/fa';

function AddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    try {
      await axios.post('http://localhost:5000/api/users', formData);
      setLoading(false);
      navigate('/users');
    } catch (err) {
      setError('Failed to add user. Please check your inputs and try again.');
      setLoading(false);
      console.error('Error adding user:', err);
    }
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white flex items-center">
        <FaUser className="mr-2 text-blue-400" />
        Add New User
      </h2>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="name" className="block mb-1 flex items-center text-gray-300">
            <FaUser className="mr-2 text-blue-400" />
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 flex items-center text-gray-300">
            <FaEnvelope className="mr-2 text-blue-400" />
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="phone" className="block mb-1 flex items-center text-gray-300">
            <FaPhone className="mr-2 text-blue-400" />
            Phone (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="address" className="block mb-1 flex items-center text-gray-300">
            <FaMapMarkerAlt className="mr-2 text-blue-400" />
            Address (Optional)
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
          ></textarea>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
          >
            <FaSave className="mr-2" />
            {loading ? 'Adding...' : 'Add User'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
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

export default AddUser;