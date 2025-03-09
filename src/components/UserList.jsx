import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { FaEye, FaEdit, FaTrash, FaUser, FaPhone, FaPlus, FaSearch, FaFileExcel } from 'react-icons/fa';
import { CiLocationOn } from "react-icons/ci";
import Pagination from './Pagination';
import * as XLSX from 'xlsx';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users');
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch users. Please try again later.');
        setLoading(false);
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        setUsers(users.filter(user => user.id !== id));
      } catch (err) {
        setError('Failed to delete user. Please try again later.');
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredUsers.map(user => ({
      'Name': user.name,
      'Email': user.email || '-',
      'Phone': user.phone || '-',
      'Address': user.address || '-'
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'user_list.xlsx');
  };

  const filteredUsers = users.filter(user => {
    return user.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaUser className="text-gray-400 mr-2" />
          <span className="font-medium text-gray-200">{row.name}</span>
        </div>
      )
    },
    {
      name: 'Address',
      selector: row => row.address,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <CiLocationOn className="text-gray-400 mr-2" />
          <span className="text-gray-300">{row.address}</span>
        </div>
      )
    },
    {
      name: 'Phone',
      selector: row => row.phone,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaPhone className="text-gray-400 mr-2" />
          <span className="text-gray-300">{row.phone || 'N/A'}</span>
        </div>
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex space-x-3">
          <Link
            to={`/users/${row.id}`}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
            title="View Details"
          >
            <FaEye />
          </Link>
          <Link
            to={`/users/edit/${row.id}`}
            className="text-green-600 hover:text-green-800 transition-colors duration-200 flex items-center"
            title="Edit User"
          >
            <FaEdit />
          </Link>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800 transition-colors duration-200 flex items-center"
            title="Delete User"
          >
            <FaTrash />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div className="text-center py-4 text-gray-200">Loading...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
            <FaUser className="mr-2 text-blue-400" />
            User List
          </h2>
        </div>
        <Link
          to="/users/add"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center w-full sm:w-auto justify-center"
        >
          <FaPlus className="mr-2" />
          Add New User
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
        <div className="w-full sm:flex-1 min-w-[200px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <button
            onClick={handleExportToExcel}
            className="w-full px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors duration-200 flex items-center justify-center"
            title="Export to Excel"
          >
            <FaFileExcel className="mr-2" />
            Export to Excel
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="py-8 text-center bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300">No users found. Add a new user to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredUsers.slice(
              (currentPage - 1) * rowsPerPage,
              currentPage * rowsPerPage
            )}
            customStyles={{
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
                pageButtonsStyle: {
                  color: '#ffffff',
                  backgroundColor: 'transparent',
                  '&:disabled': {
                    color: '#6b7280',
                  },
                  '&:hover:not(:disabled)': {
                    backgroundColor: '#1f2937',
                    color: '#3b82f6',
                  },
                  '&:focus': {
                    outline: 'none',
                    backgroundColor: '#1f2937',
                    color: '#3b82f6',
                  },
                },
                selectStyle: {
                  color: '#ffffff',
                  backgroundColor: '#1f2937',
                  borderColor: '#4b5563',
                },
                iconStyle: {
                  fill: '#ffffff',
                  '&:disabled': {
                    fill: '#6b7280',
                  },
                  '&:hover:not(:disabled)': {
                    fill: '#3b82f6',
                  },
                },
              },
            }}
            pointerOnHover
            responsive
            noHeader
            pagination={false}
          />
          
          {/* Custom pagination component */}
          <Pagination
            currentPage={currentPage}
            totalRows={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            onChangePage={setCurrentPage}
            onChangeRowsPerPage={setRowsPerPage}
          />
        </div>
      )}
    </div>
  );
}

export default UserList;