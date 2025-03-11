import { useState, useEffect } from 'react';
import { FaUser, FaUserShield, FaCheck, FaTimes, FaUserEdit, FaSpinner } from 'react-icons/fa';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleUpdating, setRoleUpdating] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users', {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setRoleUpdating(prev => ({ ...prev, [userId]: true }));
      
      const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const updatedUser = await response.json();
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: updatedUser.role } : user
      ));
      
      setSuccessMessage(`User role updated successfully to ${newRole}`);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error updating user role:', err);
    } finally {
      setRoleUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="text-blue-500 text-4xl animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 text-red-200 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FaUserShield className="mr-2 text-blue-400" />
        User Management
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-700 rounded-lg">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-600">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaUser className="text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-white">{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-300">{user.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
                    {user.role === 'admin' ? (
                      <span className="flex items-center">
                        <FaUserShield className="mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaUser className="mr-1" />
                        User
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {roleUpdating[user.id] ? (
                    <FaSpinner className="text-blue-500 animate-spin" />
                  ) : (
                    <div className="flex space-x-2">
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => handleRoleChange(user.id, 'user')}
                          className="flex items-center text-xs bg-yellow-700 text-yellow-200 px-2 py-1 rounded hover:bg-yellow-600"
                          title="Demote to User"
                        >
                          <FaUser className="mr-1" />
                          Make User
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          className="flex items-center text-xs bg-blue-700 text-blue-200 px-2 py-1 rounded hover:bg-blue-600"
                          title="Promote to Admin"
                        >
                          <FaUserShield className="mr-1" />
                          Make Admin
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-4 text-gray-400">
          No users found.
        </div>
      )}
    </div>
  );
}

export default UserManagement; 