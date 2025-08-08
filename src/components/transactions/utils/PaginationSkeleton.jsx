import React from 'react';

const PaginationSkeleton = () => {
  return (
    <div className="flex justify-between items-center pt-6 flex-shrink-0 mt-4">
      {/* Skeleton for "Showing..." text */}
      <div className="h-4 bg-gray-300 rounded-md w-48 animate-pulse"></div>
      
      {/* Skeleton for pagination buttons */}
      <div className="flex items-center gap-1">
        {/* Skeleton for Previous page button */}
        <div className="w-9 h-9 rounded-md bg-gray-300 animate-pulse"></div>

        {/* Skeleton for Page number buttons */}
        <div className="w-9 h-9 rounded-md bg-gray-300 animate-pulse"></div>
        <div className="w-9 h-9 rounded-md bg-gray-300 animate-pulse"></div>
        <div className="w-9 h-9 rounded-md bg-gray-300 animate-pulse"></div>

        {/* Skeleton for Next page button */}
        <div className="w-9 h-9 rounded-md bg-gray-300 animate-pulse"></div>
      </div>
    </div>
  );
};

export default PaginationSkeleton;
