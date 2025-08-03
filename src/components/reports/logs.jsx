import React, { useState, useEffect, useCallback } from 'react';

const PurchaseOrderLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true); // Always start with loading = true
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetails, setPODetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Debug logging - this should show loading: true initially
  console.log('=== PurchaseOrderLogs RENDER ===');
  console.log('loading:', loading);
  console.log('error:', error);
  console.log('logs count:', logs.length);
  console.log('================================');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  
  // Filter state
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    status: '',
    supplier: '',
    amountRange: { min: '', max: '' }
  });

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...logs];

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(log => new Date(log.rawDate) >= new Date(filters.dateRange.start));
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(log => new Date(log.rawDate) <= new Date(filters.dateRange.end));
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(log => log.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Supplier filter
    if (filters.supplier) {
      filtered = filtered.filter(log => log.supplier.toLowerCase().includes(filters.supplier.toLowerCase()));
    }

    // Amount range filter
    if (filters.amountRange.min) {
      filtered = filtered.filter(log => log.rawAmount >= parseFloat(filters.amountRange.min));
    }
    if (filters.amountRange.max) {
      filtered = filtered.filter(log => log.rawAmount <= parseFloat(filters.amountRange.max));
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [logs, filters]);

  // Fetch purchase order logs from API
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      console.log('fetchLogs: Setting loading to true');
      
      // Add artificial delay to see skeleton
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('fetchLogs: After 2 second delay');
      
      const response = await fetch('/api/reports/logs');
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.data);
        setFilteredLogs(result.data);
        setTotalItems(result.data.length);
      } else {
        setError(result.error || 'Failed to fetch purchase order logs');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error('Error fetching logs:', err);
    } finally {
      console.log('fetchLogs: Setting loading to false');
      setLoading(false);
    }
  }, []);

  // Fetch detailed purchase order information
  const fetchPODetails = useCallback(async (transactionId) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/reports/purchase-order-details?id=${transactionId}`);
      const result = await response.json();
      
      if (result.success) {
        setPODetails(result.data);
      } else {
        console.error('Failed to fetch PO details:', result.error);
        // Set empty state with error message
        setPODetails({
          ...selectedPO,
          items: [],
          error: result.error || 'Failed to load purchase order details'
        });
      }
    } catch (err) {
      console.error('Error fetching PO details:', err);
      // Set error state
      setPODetails({
        ...selectedPO,
        items: [],
        error: 'Failed to connect to server'
      });
    } finally {
      setLoadingDetails(false);
    }
  }, [selectedPO]);

  useEffect(() => {
    fetchLogs();

    // Test: Force loading state for 3 seconds to see skeleton
    console.log('Starting test - forcing loading for 3 seconds');
    setTimeout(() => {
      console.log('Test complete - should show skeleton during this time');
    }, 3000);

    // Listen for filter events from Astro page
    const handleApplyFilters = (event) => {
      setFilters(event.detail);
    };

    const handleClearFilters = () => {
      setFilters({
        dateRange: { start: '', end: '' },
        status: '',
        supplier: '',
        amountRange: { min: '', max: '' }
      });
    };

    const handlePageChange = (event) => {
      setCurrentPage(event.detail.page);
    };

    window.addEventListener('applyFilters', handleApplyFilters);
    window.addEventListener('clearFilters', handleClearFilters);
    window.addEventListener('changePage', handlePageChange);

    return () => {
      window.removeEventListener('applyFilters', handleApplyFilters);
      window.removeEventListener('clearFilters', handleClearFilters);
      window.removeEventListener('changePage', handlePageChange);
    };
  }, [fetchLogs]);
  
  // Dispatch pagination info to Astro component
  useEffect(() => {
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const paginationEvent = new CustomEvent('paginationUpdate', {
      detail: {
        currentPage,
        totalPages,
        totalItems: filteredLogs.length,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, filteredLogs.length),
        itemsPerPage
      }
    });
    window.dispatchEvent(paginationEvent);
  }, [currentPage, filteredLogs, itemsPerPage]);

  // Apply filters when filters state changes
  useEffect(() => {
    applyFilters();
  }, [filters, applyFilters]);

  // Sorting function
  const handleSort = useCallback((column) => {
    let direction = 'asc';
    
    if (sortConfig.column === column) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ column, direction });
  }, [sortConfig]);

  // Get sorted data
  const getSortedData = useCallback(() => {
    if (!sortConfig.column || !sortConfig.direction) {
      return filteredLogs;
    }

    return [...filteredLogs].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.column) {
        case 'poNumber':
          aValue = a.poNumber || '';
          bValue = b.poNumber || '';
          break;
        case 'dateCreated':
          aValue = new Date(a.rawDate);
          bValue = new Date(b.rawDate);
          break;
        case 'supplier':
          aValue = (a.supplier || '').toLowerCase();
          bValue = (b.supplier || '').toLowerCase();
          break;
        case 'totalQuantity':
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case 'totalAmount':
          aValue = a.rawAmount;
          bValue = b.rawAmount;
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'createdBy':
          aValue = (a.createdBy || '').toLowerCase();
          bValue = (b.createdBy || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLogs, sortConfig]);

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate dynamic dropdown options based on total data
  const generateDropdownOptions = () => {
    const totalItems = filteredLogs.length;
    const options = [];
    
    // Standard options that make sense for the data size
    const standardOptions = [5, 10, 25, 50, 100];
    
    for (const option of standardOptions) {
      if (option <= totalItems) {
        options.push(option);
      }
    }
    
    // Always add "All" option if there are items
    if (totalItems > 0) {
      options.push(totalItems); // "All" will show the total count
    }
    
    // Ensure current itemsPerPage is in the options
    if (!options.includes(itemsPerPage) && itemsPerPage <= totalItems) {
      options.push(itemsPerPage);
      options.sort((a, b) => a - b);
    }
    
    return options;
  };

  // Pagination logic
  const sortedData = getSortedData();
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = sortedData.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Generate pagination pages with ellipsis
  const generatePaginationPages = () => {
    const pages = [];
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Add ellipsis if needed before current page range
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Add pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      // Add ellipsis if needed after current page range
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const paginationPages = generatePaginationPages();

  // Get sort icon
  const getSortIcon = (column) => {
    if (sortConfig.column !== column) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-btn-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
        </svg>
      );
    }

    if (sortConfig.direction === 'desc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-btn-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      );
    }

    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    );
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      status: '',
      supplier: '',
      amountRange: { min: '', max: '' }
    });
    setFilteredLogs(logs);
    setCurrentPage(1);
  };

  // Get status badge classes
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'px-2 py-1 rounded text-xs font-medium text-green bg-green/10';
      case 'pending':
        return 'px-2 py-1 rounded text-xs font-medium text-orange bg-orange/10';
      case 'approved':
        return 'px-2 py-1 rounded text-xs font-medium text-blue bg-blue/10';
      case 'cancelled':
        return 'px-2 py-1 rounded text-xs font-medium text-red bg-red/10';
      default:
        return 'px-2 py-1 rounded text-xs font-medium text-gray-500 bg-gray-500/10';
    }
  };

  // Handle download PDF
  const handleDownloadPDF = (log) => {
    // This would generate and download a PDF for the purchase order
    console.log('Downloading PDF for:', log.poNumber);
    // Implementation would depend on your PDF generation service
    alert(`Downloading PDF for ${log.poNumber}`);
  };

  // Handle view details
  const handleViewDetails = (log) => {
    setSelectedPO(log);
    setShowDetailsModal(true);
    fetchPODetails(log.id);
  };

  // Close modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPO(null);
    setPODetails(null);
  };

  if (loading) {
    console.log('🟡 SHOWING SKELETON SCREEN - loading is true');
    return (
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Skeleton Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-primary">
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Purchase Order #</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Date Created</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Supplier</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Total Quantity</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Total Amount</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Status</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Created By</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-gray-800">
                    <td className="px-4 py-3">
                      <div className="animate-pulse bg-gray-700 h-4 w-20 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="animate-pulse bg-gray-700 h-4 w-24 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="animate-pulse bg-gray-700 h-4 w-32 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="animate-pulse bg-gray-700 h-4 w-16 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="animate-pulse bg-gray-700 h-4 w-20 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="animate-pulse bg-gray-700 h-6 w-18 rounded-full"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="animate-pulse bg-gray-700 h-4 w-24 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse bg-gray-700 h-6 w-6 rounded"></div>
                        <div className="animate-pulse bg-gray-700 h-6 w-6 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skeleton Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-6 border-t border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <div className="animate-pulse bg-gray-700 h-8 w-16 rounded"></div>
            <div className="animate-pulse bg-gray-700 h-4 w-40 rounded"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="animate-pulse bg-gray-700 h-8 w-8 rounded"></div>
            <div className="animate-pulse bg-gray-700 h-8 w-8 rounded"></div>
            <div className="animate-pulse bg-gray-700 h-8 w-8 rounded"></div>
            <div className="animate-pulse bg-gray-700 h-8 w-8 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {loading && (
        <>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-primary">
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Purchase Order #</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Date Created</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Supplier</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Total Quantity</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Total Amount</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Status</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Created By</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b border-gray-800">
                      <td className="px-4 py-3">
                        <div className="animate-pulse bg-gray-700 h-4 w-20 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="animate-pulse bg-gray-700 h-4 w-24 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="animate-pulse bg-gray-700 h-4 w-32 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="animate-pulse bg-gray-700 h-4 w-16 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="animate-pulse bg-gray-700 h-4 w-20 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="animate-pulse bg-gray-700 h-6 w-18 rounded-full"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="animate-pulse bg-gray-700 h-4 w-24 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-pulse bg-gray-700 h-6 w-6 rounded"></div>
                          <div className="animate-pulse bg-gray-700 h-6 w-6 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-6 border-t border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <div className="animate-pulse bg-gray-700 h-8 w-16 rounded"></div>
              <div className="animate-pulse bg-gray-700 h-4 w-40 rounded"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="animate-pulse bg-gray-700 h-8 w-8 rounded"></div>
              <div className="animate-pulse bg-gray-700 h-8 w-8 rounded"></div>
              <div className="animate-pulse bg-gray-700 h-8 w-8 rounded"></div>
              <div className="animate-pulse bg-gray-700 h-8 w-8 rounded"></div>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-primary">
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">
                      <button
                        onClick={() => handleSort('poNumber')}
                        className={`flex items-center gap-2 hover:text-btn-primary transition-colors ${
                          sortConfig.column === 'poNumber' ? 'text-btn-primary' : ''
                        }`}
                      >
                        Purchase Order #
                        {getSortIcon('poNumber')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">
                      <button
                        onClick={() => handleSort('dateCreated')}
                        className={`flex items-center gap-2 hover:text-btn-primary transition-colors ${
                          sortConfig.column === 'dateCreated' ? 'text-btn-primary' : ''
                        }`}
                      >
                        Date Created
                        {getSortIcon('dateCreated')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">
                      <button
                        onClick={() => handleSort('supplier')}
                        className={`flex items-center gap-2 hover:text-btn-primary transition-colors ${
                          sortConfig.column === 'supplier' ? 'text-btn-primary' : ''
                        }`}
                      >
                        Supplier
                        {getSortIcon('supplier')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">
                      <button
                        onClick={() => handleSort('totalQuantity')}
                        className={`flex items-center gap-2 hover:text-btn-primary transition-colors ${
                          sortConfig.column === 'totalQuantity' ? 'text-btn-primary' : ''
                        }`}
                      >
                        Total Quantity
                        {getSortIcon('totalQuantity')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">
                      <button
                        onClick={() => handleSort('totalAmount')}
                        className={`flex items-center gap-2 hover:text-btn-primary transition-colors ${
                          sortConfig.column === 'totalAmount' ? 'text-btn-primary' : ''
                        }`}
                      >
                        Total Amount
                        {getSortIcon('totalAmount')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">
                      <button
                        onClick={() => handleSort('status')}
                        className={`flex items-center gap-2 hover:text-btn-primary transition-colors ${
                          sortConfig.column === 'status' ? 'text-btn-primary' : ''
                        }`}
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">
                      <button
                        onClick={() => handleSort('createdBy')}
                        className={`flex items-center gap-2 hover:text-btn-primary transition-colors ${
                          sortConfig.column === 'createdBy' ? 'text-btn-primary' : ''
                        }`}
                      >
                        Created By
                        {getSortIcon('createdBy')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-textColor-tertiary">
                        No purchase order logs found
                      </td>
                    </tr>
                  ) : (
                    currentLogs.map((log) => (
                      <tr 
                        key={log.id} 
                        className="border-b border-gray-800 hover:bg-tbl-hover transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(log)}
                      >
                        <td className="px-4 py-3 text-textColor-primary text-sm font-medium">
                          {log.poNumber}
                        </td>
                        <td className="px-4 py-3 text-textColor-primary text-sm">
                          {log.dateCreated}
                        </td>
                        <td className="px-4 py-3 text-textColor-primary text-sm">
                          {log.supplier}
                        </td>
                        <td className="px-4 py-3 text-textColor-primary text-sm">
                          {log.totalQuantity} pcs
                        </td>
                        <td className="px-4 py-3 text-textColor-primary text-sm font-medium">
                          {log.totalAmount}
                        </td>
                        <td className="px-4 py-3">
                          <span className={getStatusBadgeClass(log.status)}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-textColor-primary text-sm">
                          {log.createdBy}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(log)}
                              className="p-1 text-btn-primary hover:text-textColor-primary transition-colors"
                              title="View Details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(log)}
                              className="p-1 text-green hover:text-textColor-primary transition-colors"
                              title="Download PDF"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-6 border-t border-gray-700 flex-shrink-0">
            {/* Items per page info with dropdown */}
            <div className="flex items-center gap-2 text-sm">
              <select 
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                className="rounded px-2 py-1 text-sm focus:outline-none cursor-pointer appearance-none bg-no-repeat bg-right pr-6"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  borderColor: 'var(--color-border_color)',
                  color: 'var(--color-textColor-primary)',
                  border: '1px solid var(--color-border_color)',
                  backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1rem'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8b5cf6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border_color)';
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'var(--color-border_color)';
                }}
              >
                {generateDropdownOptions().map(option => (
                  <option key={option} value={option}>
                    {option === filteredLogs.length ? `All (${option})` : option}
                  </option>
                ))}
              </select>
              <span className="text-textColor-tertiary">
                Showing {Math.min(startIndex + 1, sortedData.length)}-{Math.min(endIndex, sortedData.length)} of {sortedData.length} purchase orders
              </span>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button 
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md transition-colors ${
                    currentPage > 1
                      ? 'text-textColor-primary hover:bg-gray-700 ' 
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Page Numbers */}
                {paginationPages.map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">...</span>
                    );
                  }
                  
                  const isActive = page === currentPage;
                  return (
                    <button 
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-btn-primary text-white hover:bg-btn-hover ' 
                          : 'text-textColor-primary hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button 
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md transition-colors ${
                    currentPage < totalPages
                      ? 'text-textColor-primary hover:bg-gray-700 ' 
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Show page 1 when "All" is selected or single page */}
            {sortedData.length > 0 && totalPages <= 1 && (
              <div className="flex items-center gap-1">
                <button 
                  className="px-3 py-2 rounded-md text-sm font-medium bg-btn-primary text-white"
                >
                  1
                </button>
              </div>
            )}
            
            {/* Empty space when no data to maintain layout */}
            {sortedData.length === 0 && (
              <div></div>
            )}
          </div>
        </>
      )}

      {/* Purchase Order Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-textColor-primary text-xl font-semibold">
                Purchase Order Details
              </h2>
              <button 
                onClick={closeDetailsModal}
                className="p-2 text-textColor-primary hover:bg-btn-hover hover:text-white rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingDetails ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-textColor-primary">Loading purchase order details...</div>
                </div>
              ) : selectedPO && (
                <div className="space-y-6">
                  {/* Primary Details Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-textColor-primary text-lg font-medium border-b border-gray-700 pb-2">
                        Primary Details
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-textColor-tertiary text-sm">Invoice Number</label>
                          <p className="text-textColor-primary font-medium">{poDetails?.poNumber || selectedPO.poNumber}</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-sm">Date Generated</label>
                          <p className="text-textColor-primary">{poDetails?.dateCreated || selectedPO.dateCreated}</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-sm">Transaction Type</label>
                          <p className="text-textColor-primary">Purchase Order</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-sm">Status</label>
                          <span className={getStatusBadgeClass(poDetails?.status || selectedPO.status)}>
                            {poDetails?.status || selectedPO.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-textColor-primary text-lg font-medium border-b border-gray-700 pb-2">
                        Summary
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-textColor-tertiary text-sm">Total Quantity</label>
                          <p className="text-textColor-primary font-medium">{poDetails?.totalQuantity || selectedPO.totalQuantity} pcs</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-sm">Total Amount</label>
                          <p className="text-textColor-primary font-medium text-lg">{poDetails?.totalAmount || selectedPO.totalAmount}</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-sm">Created By</label>
                          <p className="text-textColor-primary">{poDetails?.createdBy || selectedPO.createdBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Purchased Products Table */}
                  <div className="space-y-4">
                    <h3 className="text-textColor-primary text-lg font-medium border-b border-gray-700 pb-2">
                      Purchased Products
                    </h3>
                    
                    {poDetails?.error ? (
                      <div className="text-center py-8">
                        <div className="text-red-400 mb-2">Error loading product details</div>
                        <div className="text-textColor-tertiary text-sm">{poDetails.error}</div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-background">
                            <tr className="border-b border-gray-700">
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">Product Name</th>
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">Supplier</th>
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">Quantity</th>
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">Unit Price</th>
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">Total Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {poDetails?.items && poDetails.items.length > 0 ? (
                              poDetails.items.map((item, index) => (
                                <tr key={item.id || index} className="border-b border-gray-800 hover:bg-tbl-hover transition-colors">
                                  <td className="px-4 py-3 text-textColor-primary">{item.name}</td>
                                  <td className="px-4 py-3 text-textColor-primary">{item.supplier}</td>
                                  <td className="px-4 py-3 text-textColor-primary">{item.quantity} pcs</td>
                                  <td className="px-4 py-3 text-textColor-primary">{item.unitPrice}</td>
                                  <td className="px-4 py-3 text-textColor-primary font-medium">{item.totalPrice}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-textColor-tertiary">
                                  No product details available for this purchase order
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => handleDownloadPDF(selectedPO)}
                className="px-4 py-2 bg-green hover:bg-green/80 text-white rounded font-medium transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={closeDetailsModal}
                className="px-4 py-2 bg-background hover:bg-textColor-tertiary text-textColor-primary rounded font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderLogs;
