import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import PurchaseForm from './PurchaseForm';

function AddPurchase() {
  return (
    <div>
      <div className="mb-6 flex items-center">
        <Link to="/purchases" className="flex items-center text-blue-400 hover:text-blue-300 mr-4">
          <FaArrowLeft className="mr-2" />
          <span>Back to Purchases</span>
        </Link>
        <h2 className="text-2xl font-bold text-white">Add New Purchase</h2>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <PurchaseForm />
        </div>
      </div>
    </div>
  );
}

export default AddPurchase;