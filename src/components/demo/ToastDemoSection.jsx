import React from 'react';
import { ToastProvider } from '../common/ToastProvider.jsx';
import ToastDemo from './ToastDemo.jsx';
import SimpleToastTest from './SimpleToastTest.jsx';

const ToastDemoSection = () => {
  return (
    <ToastProvider>
      <div className="bg-primary p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-textColor-primary">Toast Notifications</h2>
        <p className="text-textColor-secondary mb-4 text-sm">
          Test the comprehensive notification system for inventory management operations.
        </p>
        <SimpleToastTest />
        <div className="mt-4">
          <ToastDemo />
        </div>
      </div>
    </ToastProvider>
  );
};

export default ToastDemoSection;
