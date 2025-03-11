import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import PurchaseForm from './PurchaseForm';

function EditPurchase() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Add auth headers function
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

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/purchases/${id}`, {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPurchase(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching purchase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
    <div>
      <div className="mb-6 flex items-center">
        <Link to="/" className="flex items-center text-blue-400 hover:text-blue-300 mr-4">
          <FaArrowLeft className="mr-2" />
          <span>Back to Purchases</span>
        </Link>
        <h2 className="text-2xl font-bold text-white">Edit Purchase #{id}</h2>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          {purchase && <PurchaseForm initialData={purchase} id={id} />}
        </div>
      </div>
    </div>
  );
}

export default EditPurchase;