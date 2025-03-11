import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

// ProtectedRoute component that checks if user is authenticated and has the required role
function ProtectedRoute({ requireAdmin = false }) {
  const { user, isAuthenticated, loading, isAdmin } = useContext(AuthContext);

  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If admin is required but user is not admin, redirect to unauthorized
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If all checks pass, render the child routes
  return <Outlet />;
}

export default ProtectedRoute; 