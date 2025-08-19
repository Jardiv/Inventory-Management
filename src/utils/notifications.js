// Comprehensive notification system for Inventory Management
// This file defines all notification scenarios and provides helper functions

export const NOTIFICATION_TYPES = {
  ERROR: 'error',
  WARNING: 'warning', 
  SUCCESS: 'success',
  INFO: 'info'
};

// Comprehensive list of notification scenarios for inventory management
export const NOTIFICATION_SCENARIOS = {
  // STOCK MANAGEMENT
  OUT_OF_STOCK: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Out of Stock!',
    getMessage: (product) => `Product "${product}" is out of stock. Please restock soon!`,
    duration: 0 // Persistent until dismissed
  },
  
  LOW_QUANTITY: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Low Quantity!',
    getMessage: (product, quantity, threshold) => `"${product}" is running low on stock. Current: ${quantity}, Threshold: ${threshold}`,
    duration: 8000
  },
  
  ITEM_RESTOCKED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Item has been restocked!',
    getMessage: (product, quantity) => `"${product}" has been successfully restocked with ${quantity} units`,
    duration: 5000
  },
  
  STOCK_UPDATED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Stock Updated',
    getMessage: (product, newQuantity) => `"${product}" stock updated to ${newQuantity} units`,
    duration: 4000
  },
  
  // EXPIRATION MANAGEMENT
  ITEM_EXPIRED: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Item has expired!',
    getMessage: (product, expiredDate) => `Product "${product}" expired on ${expiredDate}. Remove from inventory.`,
    duration: 0
  },
  
  ITEM_EXPIRING_SOON: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Item is expiring soon!',
    getMessage: (product, expiryDate, daysLeft) => `Product "${product}" expires in ${daysLeft} days (${expiryDate}). Take action soon.`,
    duration: 10000
  },
  
  BATCH_EXPIRING: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Multiple items expiring!',
    getMessage: (count) => `${count} products are expiring within the next 7 days. Check expiration report.`,
    duration: 0
  },
  
  // ORDER MANAGEMENT
  ORDER_PLACED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Order Placed Successfully',
    getMessage: (orderNumber, supplier) => `Order #${orderNumber} placed with ${supplier}`,
    duration: 5000
  },
  
  ORDER_RECEIVED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Order Received',
    getMessage: (orderNumber) => `Order #${orderNumber} has been received and processed`,
    duration: 5000
  },
  
  ORDER_DELAYED: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Order Delayed',
    getMessage: (orderNumber, newDate) => `Order #${orderNumber} delivery delayed to ${newDate}`,
    duration: 8000
  },
  
  ORDER_CANCELLED: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Order Cancelled',
    getMessage: (orderNumber, reason) => `Order #${orderNumber} cancelled. Reason: ${reason}`,
    duration: 0
  },
  
  // SUPPLIER MANAGEMENT
  SUPPLIER_UNAVAILABLE: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Supplier Unavailable',
    getMessage: (supplier, product) => `Supplier "${supplier}" is unavailable for "${product}". Consider alternative suppliers.`,
    duration: 10000
  },
  
  PRICE_CHANGE: {
    type: NOTIFICATION_TYPES.INFO,
    title: 'Price Update',
    getMessage: (product, oldPrice, newPrice) => `Price changed for "${product}": ${oldPrice} → ${newPrice}`,
    duration: 6000
  },
  
  // SYSTEM OPERATIONS
  BACKUP_COMPLETED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Backup Completed',
    getMessage: (timestamp) => `System backup completed successfully at ${timestamp}`,
    duration: 4000
  },
  
  BACKUP_FAILED: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Backup Failed',
    getMessage: (error) => `System backup failed: ${error}. Please try again or contact support.`,
    duration: 0
  },
  
  DATA_SYNC_SUCCESS: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Data Synchronized',
    getMessage: (recordCount) => `Successfully synchronized ${recordCount} records with external systems`,
    duration: 4000
  },
  
  DATA_SYNC_ERROR: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Sync Error',
    getMessage: (error) => `Data synchronization failed: ${error}`,
    duration: 0
  },
  
  // USER ACTIONS
  ITEM_ADDED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Item Added',
    getMessage: (product) => `"${product}" has been added to inventory`,
    duration: 4000
  },
  
  ITEM_UPDATED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Item Updated',
    getMessage: (product) => `"${product}" details have been updated`,
    duration: 4000
  },
  
  ITEM_DELETED: {
    type: NOTIFICATION_TYPES.INFO,
    title: 'Item Removed',
    getMessage: (product) => `"${product}" has been removed from inventory`,
    duration: 4000
  },
  
  BULK_UPDATE_SUCCESS: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Bulk Update Completed',
    getMessage: (count) => `Successfully updated ${count} items`,
    duration: 5000
  },
  
  // REPORTS & ANALYTICS
  REPORT_GENERATED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Report Generated',
    getMessage: (reportType) => `${reportType} report has been generated and is ready for download`,
    duration: 5000
  },
  
  REPORT_ERROR: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Report Generation Failed',
    getMessage: (reportType, error) => `Failed to generate ${reportType} report: ${error}`,
    duration: 8000
  },
  
  // ALERTS & MONITORING
  UNUSUAL_ACTIVITY: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Unusual Activity Detected',
    getMessage: (activity) => `Unusual activity detected: ${activity}. Please review.`,
    duration: 0
  },
  
  THRESHOLD_BREACH: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Threshold Breached',
    getMessage: (metric, value, threshold) => `${metric} has exceeded threshold: ${value} > ${threshold}`,
    duration: 10000
  },
  
  SYSTEM_MAINTENANCE: {
    type: NOTIFICATION_TYPES.INFO,
    title: 'System Maintenance',
    getMessage: (startTime, duration) => `Scheduled maintenance starting at ${startTime} for ${duration}`,
    duration: 15000
  },
  
  // VALIDATION & ERRORS
  VALIDATION_ERROR: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Validation Error',
    getMessage: (field, error) => `${field}: ${error}`,
    duration: 6000
  },
  
  PERMISSION_DENIED: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Access Denied',
    getMessage: (action) => `You don't have permission to ${action}`,
    duration: 5000
  },
  
  NETWORK_ERROR: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Connection Error',
    getMessage: () => `Network connection lost. Please check your internet connection.`,
    duration: 0
  },
  
  // IMPORT/EXPORT
  IMPORT_SUCCESS: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Import Completed',
    getMessage: (count, source) => `Successfully imported ${count} items from ${source}`,
    duration: 5000
  },
  
  IMPORT_ERROR: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Import Failed',
    getMessage: (error, line) => `Import failed at line ${line}: ${error}`,
    duration: 0
  },
  
  EXPORT_SUCCESS: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Export Completed',
    getMessage: (format, count) => `Successfully exported ${count} items to ${format} format`,
    duration: 5000
  },
  
  // AUDIT & COMPLIANCE
  AUDIT_ALERT: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Audit Alert',
    getMessage: (issue) => `Audit compliance issue detected: ${issue}`,
    duration: 0
  },
  
  COMPLIANCE_CHECK_PASSED: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Compliance Check Passed',
    getMessage: (checkType) => `${checkType} compliance check completed successfully`,
    duration: 5000
  },
  
  // GENERAL SUCCESS/ERROR STATES
  ACTION_SUCCESS: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Action successfully completed!',
    getMessage: (action) => `${action} has been processed successfully`,
    duration: 4000
  },
  
  ACTION_FAILED: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'Something Went Wrong!',
    getMessage: (action, error) => `Failed to ${action}: ${error || 'Unknown error occurred'}`,
    duration: 8000
  },
  
  ATTENTION_NEEDED: {
    type: NOTIFICATION_TYPES.WARNING,
    title: 'Attention Needed!',
    getMessage: (issue) => `${issue} requires your attention`,
    duration: 10000
  }
};

// Helper function to show notifications using the scenarios
export const showNotification = (toastContext, scenarioKey, ...params) => {
  const scenario = NOTIFICATION_SCENARIOS[scenarioKey];
  if (!scenario) {
    console.error(`Unknown notification scenario: ${scenarioKey}`);
    return;
  }
  
  const message = typeof scenario.getMessage === 'function' 
    ? scenario.getMessage(...params)
    : scenario.getMessage;
    
  switch (scenario.type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return toastContext.showSuccess(scenario.title, message, scenario.duration);
    case NOTIFICATION_TYPES.ERROR:
      return toastContext.showError(scenario.title, message, scenario.duration);
    case NOTIFICATION_TYPES.WARNING:
      return toastContext.showWarning(scenario.title, message, scenario.duration);
    case NOTIFICATION_TYPES.INFO:
    default:
      return toastContext.showInfo(scenario.title, message, scenario.duration);
  }
};

// Quick access functions for common scenarios
export const notifyOutOfStock = (toastContext, product) => 
  showNotification(toastContext, 'OUT_OF_STOCK', product);

export const notifyLowQuantity = (toastContext, product, quantity, threshold) => 
  showNotification(toastContext, 'LOW_QUANTITY', product, quantity, threshold);

export const notifyItemRestocked = (toastContext, product, quantity) => 
  showNotification(toastContext, 'ITEM_RESTOCKED', product, quantity);

export const notifyActionSuccess = (toastContext, action) => 
  showNotification(toastContext, 'ACTION_SUCCESS', action);

export const notifyActionFailed = (toastContext, action, error) => 
  showNotification(toastContext, 'ACTION_FAILED', action, error);

export const notifyAttentionNeeded = (toastContext, issue) => 
  showNotification(toastContext, 'ATTENTION_NEEDED', issue);

export const notifyItemExpiring = (toastContext, product, expiryDate, daysLeft) => 
  showNotification(toastContext, 'ITEM_EXPIRING_SOON', product, expiryDate, daysLeft);

export const notifyOrderPlaced = (toastContext, orderNumber, supplier) => 
  showNotification(toastContext, 'ORDER_PLACED', orderNumber, supplier);

export const notifyValidationError = (toastContext, field, error) => 
  showNotification(toastContext, 'VALIDATION_ERROR', field, error);

export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_SCENARIOS,
  showNotification,
  notifyOutOfStock,
  notifyLowQuantity,
  notifyItemRestocked,
  notifyActionSuccess,
  notifyActionFailed,
  notifyAttentionNeeded,
  notifyItemExpiring,
  notifyOrderPlaced,
  notifyValidationError
};
