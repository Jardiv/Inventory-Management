import React, { useEffect, useState } from 'react';

const Toast = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = "flex items-center p-4 mb-3 rounded-lg border border-opacity-30 shadow-lg transition-all duration-300 transform min-w-[320px]";
    const exitStyles = isExiting ? "opacity-0 translate-x-[-100%]" : "opacity-100 translate-x-0";
    
    switch (type) {
      case 'error':
        return `${baseStyles} ${exitStyles} bg-red-900 bg-opacity-90 border-red-500 text-white`;
      case 'warning':
        return `${baseStyles} ${exitStyles} bg-yellow-900 bg-opacity-90 border-yellow-500 text-white`;
      case 'success':
        return `${baseStyles} ${exitStyles} bg-green-900 bg-opacity-90 border-green-500 text-white`;
      case 'info':
      default:
        return `${baseStyles} ${exitStyles} bg-blue-900 bg-opacity-90 border-blue-500 text-white`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <div className="w-6 h-6 mr-3 flex-shrink-0 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-6 h-6 mr-3 flex-shrink-0 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="w-6 h-6 mr-3 flex-shrink-0 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-6 h-6 mr-3 flex-shrink-0 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="flex-1">
        <div className="font-semibold text-sm text-white">{title}</div>
        <div className="text-xs text-white text-opacity-90 mt-1">{message}</div>
      </div>
      <button
        onClick={handleClose}
        className="ml-3 text-white text-opacity-70 hover:text-opacity-100 transition-opacity"
      >
        <span className="text-lg font-bold">×</span>
      </button>
    </div>
  );
};

export default Toast;