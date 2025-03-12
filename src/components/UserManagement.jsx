import { useState, useEffect } from 'react';
import { FaUser, FaUserShield, FaCheck, FaTimes, FaUserEdit, FaSpinner, FaSearch } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import Pagination from './Pagination';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleUpdating, setRoleUpdating] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    const fetchCurrentUser = () => {
      try {
        const userString = localStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    };
    
    fetchCurrentUser();
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

  const filteredUsers = users.filter(user => {
    return (
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Define columns for DataTable
  const columns = [
    {
      name: 'Username',
      selector: row => row.username,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaUser className="text-gray-400 mr-2" />
          <span className="font-medium text-white">{row.username}</span>
        </div>
      )
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      cell: row => (
        <span className="text-gray-300">{row.email}</span>
      )
    },
    {
      name: 'Role',
      selector: row => row.role,
      sortable: true,
      cell: row => (
        <span className={`px-2 py-1 text-xs rounded-full ${row.role === 'admin' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
          {row.role === 'admin' ? (
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
      )
    },
    {
      name: 'Created At',
      selector: row => row.created_at,
      sortable: true,
      cell: row => (
        <span className="text-gray-300">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      name: 'Actions',
      cell: row => {
        const isAdmin = currentUser?.role === 'admin';
        
        if (!isAdmin) {
          return <span className="text-gray-500 text-xs">No actions available</span>;
        }
        
        return roleUpdating[row.id] ? (
          <FaSpinner className="text-blue-500 animate-spin" />
        ) : (
          <div className="flex space-x-2">
            {row.role === 'admin' ? (
              <button
                onClick={() => handleRoleChange(row.id, 'user')}
                className="flex items-center text-xs bg-yellow-700 text-yellow-200 px-2 py-1 rounded hover:bg-yellow-600"
                title="Demote to User"
              >
                <FaUser className="mr-1" />
                Make User
              </button>
            ) : (
              <button
                onClick={() => handleRoleChange(row.id, 'admin')}
                className="flex items-center text-xs bg-blue-700 text-blue-200 px-2 py-1 rounded hover:bg-blue-600"
                title="Promote to Admin"
              >
                <FaUserShield className="mr-1" />
                Make Admin
              </button>
            )}
          </div>
        );
      },
      button: true,
    }
  ];

  // Define DataTable styles
  const customStyles = {
    table: {
      style: {
        backgroundColor: '#111827',
        color: '#e5e7eb',
      },
    },
    tableWrapper: {
      style: {
        borderRadius: '0.375rem',
        overflow: 'hidden',
        border: '1px solid #374151',
      },
    },
    header: {
      style: {
        backgroundColor: '#111827',
        color: '#e5e7eb',
        minHeight: '56px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#1f2937',
        borderBottomWidth: '1px',
        borderBottomColor: '#374151',
      },
    },
    headCells: {
      style: {
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        color: '#d1d5db',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '0.875rem',
        backgroundColor: '#111827',
        '&:hover': {
          backgroundColor: '#1f2937',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        color: '#e5e7eb',
      },
    },
    pagination: {
      style: {
        backgroundColor: '#111827',
        color: '#e5e7eb',
        borderTopWidth: '1px',
        borderTopColor: '#374151',
      },
    },
  };

  // Success message component
  const SuccessAlert = () => {
    if (!successMessage) return null;
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center" role="alert">
        <FaCheck className="mr-2" />
        <span>{successMessage}</span>
      </div>
    );
  };

  // Error message component
  const ErrorAlert = () => {
    if (!error) return null;
    return (
      <div className="bg-red-900 border border-red-800 text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
        <div className="flex items-center mb-2">
          <FaTimes className="mr-2" />
          <span className="font-medium">{error}</span>
        </div>
        <button 
          onClick={() => fetchUsers()} 
          className="bg-red-800 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-sm inline-flex items-center"
        >
          <FaSpinner className="w-4 h-4 mr-1" />
          Retry
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FaUserShield className="mr-2 text-blue-400" />
        User Management
      </h2>
      
      <SuccessAlert />
      <ErrorAlert />
      
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-gray-700 focus:border-gray-600 focus:ring-0 focus:text-gray-200 sm:text-sm"
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-200">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-8 text-center bg-gray-700 rounded-lg border border-gray-600">
          <p className="text-gray-300">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredUsers.slice(
              (currentPage - 1) * rowsPerPage,
              currentPage * rowsPerPage
            )}
            customStyles={customStyles}
            pointerOnHover
            responsive
            noHeader
            pagination={false}
          />
          
          {/* Custom pagination component */}
          {filteredUsers.length > rowsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalRows={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              onChangePage={setCurrentPage}
              onChangeRowsPerPage={setRowsPerPage}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default UserManagement; 