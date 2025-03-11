import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <FaExclamationTriangle className="mx-auto text-yellow-500 text-5xl mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6">
            You don't have permission to access this page. This area requires administrator privileges.
          </p>
          <div className="flex justify-center">
            <Link
              to="/"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized; 