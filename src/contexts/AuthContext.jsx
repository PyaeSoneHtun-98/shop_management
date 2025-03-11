import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        console.log('Checking if user is logged in...');
        
        // Get token from localStorage if available
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token ? 'Found' : 'Not found');
        
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('User authenticated:', data.user);
          setUser(data.user);
        } else {
          console.log('Authentication failed, status:', response.status);
          // Clear localStorage if authentication fails
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = (userData) => {
    console.log('Setting user in context:', userData);
    setUser(userData);
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('Logging out...');
      
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Clear localStorage
      localStorage.removeItem('token');
      
      setUser(null);
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAdmin, 
      isAuthenticated,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 