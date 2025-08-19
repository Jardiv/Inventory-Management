import React from 'react';
import { ToastProvider } from './ToastProvider.jsx';

// This component wraps the ToastProvider for use in Astro layouts
const ToastContainer = ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};

export default ToastContainer;
