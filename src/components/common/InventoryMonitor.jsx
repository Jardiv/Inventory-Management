// Simple inventory monitoring component for global notifications
import { useEffect } from 'react';
import { useToast } from './ToastProvider.jsx';
import { supabase } from '../../utils/supabaseClient.js';
import { 
  notifyLowQuantity, 
  notifyOutOfStock, 
  notifyRestocked 
} from '../../utils/notifications.js';

const InventoryMonitor = () => {
  const toast = useToast();

  useEffect(() => {
    console.log('Starting inventory monitoring...');
    
    // Set up real-time subscription for database changes
    const subscription = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        (payload) => {
          console.log('Database change detected:', payload);
          handleInventoryChange(payload);
        }
      )
      .subscribe();

    // Handle inventory changes
    function handleInventoryChange(payload) {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'UPDATE' && newRecord && oldRecord) {
        const productName = newRecord.product_name || newRecord.name || 'Unknown Product';
        
        // Check for quantity changes
        if (oldRecord.quantity !== newRecord.quantity) {
          const oldQty = oldRecord.quantity || 0;
          const newQty = newRecord.quantity || 0;
          
          // Out of stock alert
          if (oldQty > 0 && newQty === 0) {
            notifyOutOfStock(toast, productName);
          }
          // Restocked alert
          else if (oldQty === 0 && newQty > 0) {
            notifyRestocked(toast, productName, newQty);
          }
          // Low stock alert
          else if (newQty > 0 && newQty <= (newRecord.reorder_level || 10)) {
            notifyLowQuantity(toast, productName, newQty, newRecord.reorder_level || 10);
          }
        }
      }
    }

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  // This component doesn't render anything
  return null;
};

export default InventoryMonitor;
