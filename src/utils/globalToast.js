// Global toast system using localStorage and window events
// This allows toast notifications to appear across different pages

export const GLOBAL_TOAST_EVENT = 'globalToastEvent';

// Broadcast a toast notification globally
export const broadcastToast = (toastData) => {
  // Store in localStorage temporarily
  const toastEvent = {
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    ...toastData
  };
  
  localStorage.setItem('pendingToast', JSON.stringify(toastEvent));
  
  // Dispatch custom event for same-page listeners
  window.dispatchEvent(new CustomEvent(GLOBAL_TOAST_EVENT, {
    detail: toastEvent
  }));
};

// Listen for global toast events
export const listenForGlobalToasts = (callback) => {
  // Listen for custom events (same page)
  const handleCustomEvent = (event) => {
    callback(event.detail);
  };
  
  // Listen for storage events (cross-page)
  const handleStorageEvent = (event) => {
    if (event.key === 'pendingToast' && event.newValue) {
      const toastData = JSON.parse(event.newValue);
      callback(toastData);
      // Clear the localStorage after processing
      localStorage.removeItem('pendingToast');
    }
  };
  
  // Check for pending toasts on page load
  const checkPendingToasts = () => {
    const pendingToast = localStorage.getItem('pendingToast');
    if (pendingToast) {
      const toastData = JSON.parse(pendingToast);
      // Only show if it's recent (within 10 seconds)
      if (Date.now() - toastData.timestamp < 10000) {
        callback(toastData);
      }
      localStorage.removeItem('pendingToast');
    }
  };
  
  window.addEventListener(GLOBAL_TOAST_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  
  // Check for pending toasts immediately
  checkPendingToasts();
  
  // Return cleanup function
  return () => {
    window.removeEventListener(GLOBAL_TOAST_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
};

// Helper function to broadcast different types of toasts
export const broadcastSuccess = (title, message, duration) => {
  broadcastToast({ type: 'success', title, message, duration });
};

export const broadcastError = (title, message, duration) => {
  broadcastToast({ type: 'error', title, message, duration });
};

export const broadcastWarning = (title, message, duration) => {
  broadcastToast({ type: 'warning', title, message, duration });
};

export const broadcastInfo = (title, message, duration) => {
  broadcastToast({ type: 'info', title, message, duration });
};
