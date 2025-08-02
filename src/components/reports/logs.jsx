import React, { useState, useEffect, useCallback } from 'react';

const PurchaseOrderLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();

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
        return 'px-2 py-1 rounded-full text-xs font-medium text-green bg-green/10';
      case 'pending':
        return 'px-2 py-1 rounded-full text-xs font-medium text-orange bg-orange/10';
      case 'approved':
        return 'px-2 py-1 rounded-full text-xs font-medium text-blue bg-blue/10';
      case 'cancelled':
        return 'px-2 py-1 rounded-full text-xs font-medium text-red bg-red/10';
      default:
        return 'px-2 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-500/10';
    }
  };

  // Pagination
  const sortedData = getSortedData();
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = sortedData.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
    // This would open a detailed view of the purchase order
    console.log('Viewing details for:', log.poNumber);
    // Implementation would depend on your routing setup
    alert(`Viewing details for ${log.poNumber}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-textColor-primary">Loading purchase order logs...</div>
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
    <div className="h-full overflow-y-auto">
      {/* Purchase Order Logs Table */}
      <div className="overflow-x-auto">
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
                <tr key={log.id} className="border-b border-gray-800 hover:bg-tbl-hover transition-colors">
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
  );
};

export default PurchaseOrderLogs;
