import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // Modal table sorting state
  const [modalSortConfig, setModalSortConfig] = useState({ column: null, direction: null });
  
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
      console.log('🔍 Fetching PO details for transaction ID:', transactionId);
      setLoadingDetails(true);
      const response = await fetch(`/api/reports/purchase-order-details?id=${transactionId}`);
      console.log('📡 API Response status:', response.status);
      
      const result = await response.json();
      console.log('📊 API Response data:', result);
      
      if (result.success) {
        setPODetails(result.data);
      } else {
        console.error('❌ Failed to fetch PO details:', result.error);
        // Set empty state with error message
        setPODetails({
          ...selectedPO,
          items: [],
          error: result.error || 'Failed to load purchase order details'
        });
      }
    } catch (err) {
      console.error('❌ Error fetching PO details:', err);
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

  // ...existing code...

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
    setModalSortConfig({ column: null, direction: null }); // Reset modal sorting
  };

  // Modal table sorting function
  const handleModalSort = useCallback((column) => {
    let direction = 'asc';
    
    if (modalSortConfig.column === column) {
      if (modalSortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (modalSortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setModalSortConfig({ column, direction });
  }, [modalSortConfig]);

  // Get modal sort icon
  const getModalSortIcon = (column) => {
    if (modalSortConfig.column !== column) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      );
    }

    if (modalSortConfig.direction === 'asc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 text-btn-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
        </svg>
      );
    }

    if (modalSortConfig.direction === 'desc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 text-btn-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      );
    }

    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    );
  };

  // Get sorted modal data
  const getSortedModalData = useCallback(() => {
    if (!poDetails?.items || !modalSortConfig.column || !modalSortConfig.direction) {
      return poDetails?.items || [];
    }

    return [...poDetails.items].sort((a, b) => {
      let aValue, bValue;

      switch (modalSortConfig.column) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'supplier':
          aValue = (a.supplier || '').toLowerCase();
          bValue = (b.supplier || '').toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'unitPrice':
          // Extract numeric value from formatted currency string
          aValue = parseFloat((a.unitPrice || '$0').replace(/[$,]/g, '')) || 0;
          bValue = parseFloat((b.unitPrice || '$0').replace(/[$,]/g, '')) || 0;
          break;
        case 'totalPrice':
          // Extract numeric value from formatted currency string
          aValue = parseFloat((a.totalPrice || '$0').replace(/[$,]/g, '')) || 0;
          bValue = parseFloat((b.totalPrice || '$0').replace(/[$,]/g, '')) || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return modalSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return modalSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [poDetails?.items, modalSortConfig]);

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
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Invoice No.</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Date Created</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Total Quantity</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Total Amount</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Status</th>
                  <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Created By</th>
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

  // PDF download for purchase order details modal
  const handleDownloadPDF = async (po) => {
    if (!po) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      // Helper to load public logo as data URL with fallbacks
      const loadImageAsDataURL = async (paths) => {
        const tryLoad = (src) => new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = src;
        });
        for (const p of paths) {
          try { return await tryLoad(p); } catch (_) { /* try next */ }
        }
        throw new Error('Logo not found');
      };

      // Helpers to embed Poppins if available in /public/fonts
      const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk);
        }
        return btoa(binary);
      };

      const tryEmbedFont = async (path, vfsName, family, style) => {
        const res = await fetch(path);
        if (!res.ok) throw new Error('font fetch failed');
        const buf = await res.arrayBuffer();
        doc.addFileToVFS(vfsName, arrayBufferToBase64(buf));
        doc.addFont(vfsName, family, style);
      };

      let hasPoppins = false;
      try {
        await Promise.all([
          tryEmbedFont('/fonts/Poppins-Regular.ttf', 'Poppins-Regular.ttf', 'Poppins', 'normal'),
          tryEmbedFont('/fonts/Poppins-Bold.ttf', 'Poppins-Bold.ttf', 'Poppins', 'bold')
        ]);
        hasPoppins = true;
      } catch (_) {
        // fallback to default fonts silently
      }

      // Branded header with improved spacing
      let headerBottomY = 56; // default fallback
      try {
        const logoDataUrl = await loadImageAsDataURL([
          '/ims_logo.png',           // preferred
          '/ims%20logo.png',         // URL-encoded space
          '/ims logo.png',           // literal space
          '/logo.png'                // generic fallback
        ]);

        const logoX = margin;
        const logoY = 12;
        const logoW = 30;
        const logoH = 30;
        doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);

        const textX = logoX + logoW + 6; // closer to logo
        let lineY = logoY + Math.round(logoH / 2); // align IMS vertically to logo center
        if (hasPoppins) { doc.setFont('Poppins', 'bold'); } else { doc.setFont('helvetica', 'bold'); }
        doc.setFontSize(26);
        doc.text('IMS', textX, lineY);
        const imsBaselineY = lineY; // keep IMS baseline for alignment

        lineY += 6; // tight spacing for subtitle
        if (hasPoppins) { doc.setFont('Poppins', 'normal'); } else { doc.setFont('helvetica', 'normal'); }
        doc.setFontSize(12);
        doc.text('Inventory Management System', textX, lineY);

        lineY += 6; // tight spacing for contact line
        doc.setFontSize(9);
        doc.text('Address • Phone • Email • Website', textX, lineY);

        // Right-aligned stacked PURCHASE / ORDER (not bold), back to original placement
        const rightX = pageWidth - margin;
        if (hasPoppins) { doc.setFont('Poppins', 'normal'); } else { doc.setFont('helvetica', 'normal'); }
        doc.setFontSize(28);
        const purchaseTop = imsBaselineY; // align PURCHASE baseline with IMS
        doc.text('PURCHASE', rightX, purchaseTop, { align: 'right' });
        doc.text('ORDER', rightX, purchaseTop + 14, { align: 'right' });
        // Ensure modest bottom padding beneath left text block, closer line to header
        const leftTextBottom = lineY; // after contact line
        headerBottomY = Math.max(logoY + logoH, leftTextBottom + 6, purchaseTop + 14) + 4; // reduced spacing
      } catch (e) {
        // Text-only fallback header
        if (hasPoppins) { doc.setFont('Poppins', 'bold'); } else { doc.setFont('helvetica', 'bold'); }
        doc.setFontSize(26);
        doc.text('IMS', margin, 24);
        if (hasPoppins) { doc.setFont('Poppins', 'normal'); } else { doc.setFont('helvetica', 'normal'); }
        doc.setFontSize(12);
        doc.text('Inventory Management System', margin, 30);
        // Stacked PURCHASE / ORDER (not bold) on the right
        if (hasPoppins) { doc.setFont('Poppins', 'normal'); } else { doc.setFont('helvetica', 'normal'); }
        doc.setFontSize(28);
        doc.text('PURCHASE', pageWidth - margin, 24, { align: 'right' }); // align to IMS baseline 24
        doc.text('ORDER', pageWidth - margin, 38, { align: 'right' });
        // Ensure modest bottom padding beneath left text block (fallback)
        const leftTextBottomFallback = 30;
        headerBottomY = Math.max(46, leftTextBottomFallback + 6);
      }

      // Divider line below header (even closer)
      // Removed divider line and 'Purchase Order Details' text as requested
      let cursorY = headerBottomY + 8; // adjust spacing after header

      // Color constants for table headers
      const HEADER_PURPLE = [143, 0, 179]; // slightly darker

      // Primary Details
      if (hasPoppins) doc.setFont('Poppins', 'bold');
      doc.setFontSize(14);
      doc.text('Primary Details', margin, cursorY);
      const primaryDetails = [
        ['Invoice Number', po.poNumber],
        ['Date Generated', po.dateCreated],
        ['Transaction Type', 'Purchase Order'],
        ['Status', po.status],
      ];
      autoTable(doc, {
        head: [['Field', 'Value']],
        body: primaryDetails,
        startY: cursorY + 4,
        theme: 'grid',
        styles: { fontSize: 12 },
        headStyles: { fillColor: HEADER_PURPLE, textColor: 255 },
        margin: { left: margin },
      });

      // Summary
      let summaryY = doc.lastAutoTable.finalY + 8;
      if (hasPoppins) doc.setFont('Poppins', 'bold');
      doc.setFontSize(14);
      doc.text('Summary', margin, summaryY);
      const summaryDetails = [
        ['Total Quantity', po.totalQuantity + ' pcs'],
        ['Total Amount', po.totalAmount],
        ['Created By', po.createdBy],
      ];
      autoTable(doc, {
        head: [['Field', 'Value']],
        body: summaryDetails,
        startY: summaryY + 4,
        theme: 'grid',
        styles: { fontSize: 12 },
        headStyles: { fillColor: HEADER_PURPLE, textColor: 255 },
        margin: { left: margin },
      });

      // Purchased Products Table
      let productsY = doc.lastAutoTable.finalY + 8;
      if (hasPoppins) doc.setFont('Poppins', 'bold');
      doc.setFontSize(14);
      doc.text('Purchased Products', margin, productsY);
      let products = [];
      if (poDetails && Array.isArray(poDetails.items)) {
        products = poDetails.items;
      } else if (po.items) {
        products = po.items;
      } else if (po.products) {
        products = po.products;
      }
      const productRows = products.map(item => [
        item.name,
        item.supplier,
        (item.quantity !== undefined ? item.quantity : '') + ' pcs',
        item.unitPrice,
        item.totalPrice
      ]);
      autoTable(doc, {
        head: [['Product Name', 'Supplier', 'Quantity', 'Unit Price', 'Total Price']],
        body: productRows,
        startY: productsY + 4,
        theme: 'grid',
        styles: { fontSize: 12 },
        headStyles: { fillColor: HEADER_PURPLE, textColor: 255 },
        margin: { left: margin },
      });

      doc.save(`purchase_order_${po.poNumber || 'details'}.pdf`);
    } catch (err) {
      alert('PDF generation failed. Please check your browser console for errors and ensure jsPDF and jspdf-autotable are installed. Error: ' + err.message);
      console.error('PDF generation error:', err);
    }
  };
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {loading && (
        <>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-primary">
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Invoice No.</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Date Created</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Total Quantity</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Total Amount</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Status</th>
                    <th className="px-4 py-3 text-textColor-primary font-medium text-sm">Created By</th>
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
                        Invoice No.
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
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-textColor-tertiary">
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
                    {option === filteredLogs.length ? `All` : option}
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
          <div className="bg-primary rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center pl-4 pt-4 pr-4 flex-shrink-0">
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

            {loadingDetails ? (
              <>
                {/* Skeleton for Fixed Header Section - Primary Details and Summary */}
                <div className="ml-4 mr-4 pt-4 pb-4 border-b border-gray-700 flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="h-6 w-32 bg-gray-700 rounded animate-pulse border-b border-gray-700 pb-1"></div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="h-3 w-20 bg-gray-700 rounded animate-pulse mb-1"></div>
                          <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        
                        <div>
                          <div className="h-3 w-20 bg-gray-700 rounded animate-pulse mb-1"></div>
                          <div className="h-4 w-28 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        
                        <div>
                          <div className="h-3 w-24 bg-gray-700 rounded animate-pulse mb-1"></div>
                          <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        
                        <div>
                          <div className="h-3 w-12 bg-gray-700 rounded animate-pulse mb-1"></div>
                          <div className="h-6 w-20 bg-gray-700 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="h-6 w-20 bg-gray-700 rounded animate-pulse border-b border-gray-700 pb-1"></div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="h-3 w-24 bg-gray-700 rounded animate-pulse mb-1"></div>
                          <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        
                        <div>
                          <div className="h-3 w-24 bg-gray-700 rounded animate-pulse mb-1"></div>
                          <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className="h-3 w-20 bg-gray-700 rounded animate-pulse mb-1"></div>
                          <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skeleton for Scrollable Body Section - Purchased Products */}
                <div className="flex-1 min-h-0 flex flex-col overflow-auto">
                  {/* Skeleton for Fixed Section Title */}
                  <div className="px-4 pt-4 pb-2 flex-shrink-0">
                    <div className="h-6 w-40 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  
                  {/* Skeleton for Scrollable Table Content */}
                  <div className="flex-1 min-h-0 px-4">
                    <div className="flex-1">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-primary z-10">
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-3 text-left">
                              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                            </th>
                            <th className="px-4 py-3 text-left">
                              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                            </th>
                            <th className="px-4 py-3 text-left">
                              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                            </th>
                            <th className="px-4 py-3 text-left">
                              <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                            </th>
                            <th className="px-4 py-3 text-left">
                              <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 5 }, (_, index) => (
                            <tr key={`modal-skeleton-${index}`} className="border-b border-gray-800">
                              <td className="px-4 py-3">
                                <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : selectedPO && (
              <>
                {/* Fixed Header Section - Primary Details and Summary */}
                <div className="ml-4 mr-4 pt-4 pb-4 border-b border-gray-700 flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-textColor-primary text-base font-medium border-b border-gray-700 pb-1">
                        Primary Details
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="block text-textColor-tertiary text-xs">Invoice Number</label>
                          <p className="text-textColor-primary font-medium">{poDetails?.poNumber || selectedPO.poNumber}</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-xs">Date Generated</label>
                          <p className="text-textColor-primary">{poDetails?.dateCreated || selectedPO.dateCreated}</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-xs">Transaction Type</label>
                          <p className="text-textColor-primary">Purchase Order</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-xs">Status</label>
                          <span className={getStatusBadgeClass(poDetails?.status || selectedPO.status)}>
                            {poDetails?.status || selectedPO.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-textColor-primary text-base font-medium border-b border-gray-700 pb-1">
                        Summary
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="block text-textColor-tertiary text-xs">Total Quantity</label>
                          <p className="text-textColor-primary font-medium">{poDetails?.totalQuantity || selectedPO.totalQuantity} pcs</p>
                        </div>
                        
                        <div>
                          <label className="block text-textColor-tertiary text-xs">Total Amount</label>
                          <p className="text-textColor-primary font-medium">{poDetails?.totalAmount || selectedPO.totalAmount}</p>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-textColor-tertiary text-xs">Created By</label>
                          <p className="text-textColor-primary">{poDetails?.createdBy || selectedPO.createdBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Body Section - Purchased Products */}
                <div className="flex-1 min-h-0 flex flex-col overflow-auto">
                  {/* Fixed Section Title */}
                  <div className="px-4 pt-4 pb-2 flex-shrink-0 ">
                    <h3 className="text-textColor-primary text-base font-medium">
                      Purchased Products
                    </h3>
                  </div>
                  
                  {/* Scrollable Table Content */}
                  <div className="flex-1 min-h-0 px-4">
                    {poDetails?.error ? (
                      <div className="text-center py-8">
                        <div className="text-red-400 mb-2">Error loading product details</div>
                        <div className="text-textColor-tertiary text-sm">{poDetails.error}</div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-primary z-10">
                            <tr className="border-b border-gray-700">
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">
                                <button
                                  onClick={() => handleModalSort('name')}
                                  className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                    modalSortConfig.column === 'name' ? 'text-btn-primary' : ''
                                  }`}
                                >
                                  Product Name
                                  {getModalSortIcon('name')}
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">
                                <button
                                  onClick={() => handleModalSort('supplier')}
                                  className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                    modalSortConfig.column === 'supplier' ? 'text-btn-primary' : ''
                                  }`}
                                >
                                  Supplier
                                  {getModalSortIcon('supplier')}
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">
                                <button
                                  onClick={() => handleModalSort('quantity')}
                                  className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                    modalSortConfig.column === 'quantity' ? 'text-btn-primary' : ''
                                  }`}
                                >
                                  Quantity
                                  {getModalSortIcon('quantity')}
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">
                                <button
                                  onClick={() => handleModalSort('unitPrice')}
                                  className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                    modalSortConfig.column === 'unitPrice' ? 'text-btn-primary' : ''
                                  }`}
                                >
                                  Unit Price
                                  {getModalSortIcon('unitPrice')}
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left text-textColor-primary font-medium">
                                <button
                                  onClick={() => handleModalSort('totalPrice')}
                                  className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                    modalSortConfig.column === 'totalPrice' ? 'text-btn-primary' : ''
                                  }`}
                                >
                                  Total Price
                                  {getModalSortIcon('totalPrice')}
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedModalData().length > 0 ? (
                              getSortedModalData().map((item, index) => (
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
              </>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 flex-shrink-0">
              <button
                onClick={() => handleDownloadPDF(selectedPO)}
                className="px-4 py-2 bg-btn-primary hover:bg-btn-hover text-white rounded font-medium transition-colors"
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
