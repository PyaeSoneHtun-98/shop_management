import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
api.interceptors.request.use(
  config => {
    // You can add auth tokens here if needed
    return config;
  },
  error => {
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
      
      switch (status) {
        case 400:
          errorMessage = data.error || 'Bad request';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again';
          break;
        case 403:
          errorMessage = 'You do not have permission to access this resource';
          break;
        case 404:
          errorMessage = data.error || 'Resource not found';
          break;
        case 500:
          errorMessage = data.error || 'Server error. Please try again later';
          break;
        default:
          errorMessage = data.error || `Error ${status}: Something went wrong`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }
    
    // Add the error message to the error object
    error.displayMessage = errorMessage;
    
    return Promise.reject(error);
  }
);

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