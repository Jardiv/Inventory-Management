import React from 'react';
import { useToast } from '../common/ToastProvider.jsx';

const SimpleToastTest = () => {
  let toast = null;
  let error = null;
  
  try {
    toast = useToast();
  } catch (e) {
    error = e.message;
  }

  const testToast = () => {
    if (toast) {
      toast.showSuccess('Test Success', 'Toast system is working!');
    }
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="font-bold mb-2">Toast System Status</h3>
      {error ? (
        <div className="text-red-600 mb-2">
          <p>❌ Error: {error}</p>
          <p className="text-sm">ToastProvider not found</p>
        </div>
      ) : (
        <div className="text-green-600 mb-2">
          <p>✅ Toast system connected</p>
        </div>
      )}
      
      <button
        onClick={testToast}
        disabled={!toast}
        className={`px-4 py-2 rounded text-white ${
          toast 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        Test Toast
      </button>
    </div>
  );
};

export default SimpleToastTest;
