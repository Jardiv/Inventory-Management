import React from 'react';
import { useToast } from '../common/ToastProvider.jsx';
import { 
  notifyOutOfStock, 
  notifyLowQuantity, 
  notifyItemRestocked, 
  notifyActionSuccess, 
  notifyActionFailed, 
  notifyAttentionNeeded,
  notifyItemExpiring,
  notifyOrderPlaced,
  notifyValidationError,
  showNotification
} from '../../utils/notifications.js';
import { 
  broadcastSuccess, 
  broadcastError, 
  broadcastWarning, 
  broadcastInfo 
} from '../../utils/globalToast.js';

const ToastDemo = () => {
  // Make toast optional to avoid errors when not wrapped in ToastProvider
  let toast = null;
  try {
    toast = useToast();
  } catch (e) {
    // Component is not wrapped in ToastProvider, toast will be null
    console.warn('ToastDemo: ToastProvider not found, notifications disabled');
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
        <p className="text-red-800 dark:text-red-200 font-semibold">Toast Provider Not Found</p>
        <p className="text-red-600 dark:text-red-300 text-sm">This component must be wrapped in a ToastContainer to function properly.</p>
      </div>
    );
  }

  const demoNotifications = [
    {
      label: 'Out of Stock (Global)',
      action: () => {
        broadcastError('Out of Stock Alert', 'iPhone 15 Pro is now out of stock');
        if (toast) notifyOutOfStock(toast, 'iPhone 15 Pro');
      },
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      label: 'Low Quantity (Global)',
      action: () => {
        broadcastWarning('Low Stock Alert', 'Samsung Galaxy S24 - Only 5 units remaining (Reorder level: 10)');
        if (toast) notifyLowQuantity(toast, 'Samsung Galaxy S24', 5, 10);
      },
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      label: 'Item Restocked (Global)',
      action: () => {
        broadcastSuccess('Restocked', 'MacBook Air M3 - 25 units added to inventory');
        if (toast) notifyItemRestocked(toast, 'MacBook Air M3', 25);
      },
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      label: 'Action Success (Global)',
      action: () => {
        broadcastSuccess('Success', 'Inventory levels updated successfully');
        if (toast) notifyActionSuccess(toast, 'update inventory levels');
      },
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      label: 'Action Failed (Global)',
      action: () => {
        broadcastError('Sync Failed', 'Could not sync with supplier database - Connection timeout');
        if (toast) notifyActionFailed(toast, 'sync with supplier database', 'Connection timeout');
      },
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      label: 'Attention Needed (Global)',
      action: () => {
        broadcastWarning('Attention Required', 'Multiple items require price updates');
        if (toast) notifyAttentionNeeded(toast, 'Multiple items require price updates');
      },
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      label: 'Item Expiring (Global)',
      action: () => {
        broadcastWarning('Expiration Alert', 'Organic Milk expires in 3 days (2024-08-20)');
        if (toast) notifyItemExpiring(toast, 'Organic Milk', '2024-08-20', 3);
      },
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      label: 'Order Placed (Global)',
      action: () => {
        broadcastSuccess('Order Confirmed', 'Order ORD-2024-001 placed with TechSupply Co.');
        if (toast) notifyOrderPlaced(toast, 'ORD-2024-001', 'TechSupply Co.');
      },
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      label: 'Validation Error (Global)',
      action: () => {
        broadcastError('Validation Error', 'Product SKU already exists in system');
        if (toast) notifyValidationError(toast, 'Product SKU', 'SKU already exists in system');
      },
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      label: 'System Backup (Global)',
      action: () => {
        broadcastInfo('System Backup', `Backup completed at ${new Date().toLocaleString()}`);
        if (toast) showNotification(toast, 'BACKUP_COMPLETED', new Date().toLocaleString());
      },
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      label: 'Import Success (Global)',
      action: () => {
        broadcastSuccess('Import Complete', '150 items imported from Excel spreadsheet');
        if (toast) showNotification(toast, 'IMPORT_SUCCESS', 150, 'Excel spreadsheet');
      },
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      label: 'Network Error (Global)',
      action: () => {
        broadcastError('Network Error', 'Connection to server lost');
        if (toast) showNotification(toast, 'NETWORK_ERROR');
      },
      color: 'bg-red-600 hover:bg-red-700'
    }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Toast Notification Demo
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Click the buttons below to test different notification scenarios. These notifications will appear 
        <strong> globally across all pages</strong> - try navigating to other pages after clicking!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoNotifications.map((demo, index) => (
          <button
            key={index}
            onClick={demo.action}
            className={`${demo.color} text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 text-sm`}
          >
            {demo.label}
          </button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
          Additional Actions:
        </h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => toast.clearAllToasts()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
          >
            Clear All Notifications
          </button>
          <button
            onClick={() => {
              // Show multiple notifications at once
              setTimeout(() => notifyOutOfStock(toast, 'Product A'), 0);
              setTimeout(() => notifyLowQuantity(toast, 'Product B', 3, 10), 500);
              setTimeout(() => notifyItemExpiring(toast, 'Product C', '2024-08-19', 1), 1000);
              setTimeout(() => notifyAttentionNeeded(toast, 'Multiple issues detected'), 1500);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
          >
            Show Multiple
          </button>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p><strong>Note:</strong> Error notifications (red) persist until manually dismissed.</p>
        <p>Warning notifications (yellow) auto-dismiss after 8-10 seconds.</p>
        <p>Success notifications (green) auto-dismiss after 4-5 seconds.</p>
        <p>Info notifications (blue) auto-dismiss after 4-6 seconds.</p>
      </div>
    </div>
  );
};

export default ToastDemo;
