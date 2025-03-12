import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Important for cookies
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Making request with headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle errors globally
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data;
      
      console.error(`API Error ${status}:`, data);
      
      switch (status) {
        case 400:
          errorMessage = data.error || data.message || 'Bad request';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again';
          // Could also redirect to login page here
          break;
        case 403:
          errorMessage = 'You do not have permission to access this resource';
          break;
        case 404:
          errorMessage = data.error || data.message || 'Resource not found';
          break;
        case 500:
          errorMessage = data.error || data.message || 'Server error. Please try again later';
          break;
        default:
          errorMessage = data.error || data.message || `Error ${status}: Something went wrong`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      errorMessage = 'No response from server. Please check your connection';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      errorMessage = error.message;
    }
    
    // Add the error message to the error object
    error.displayMessage = errorMessage;
    
    return Promise.reject(error);
  }
);

// Helper function to get auth headers (for use with fetch API)
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// API methods
export const fetchUser = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUserPurchases = async (userId) => {
  try {
    const response = await api.get(`/purchases/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePurchase = async (id, data) => {
  try {
    const response = await api.put(`/purchases/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api; 