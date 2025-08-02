import { useState, useEffect, useCallback, useMemo } from 'react';

const LowStockTable = ({ currentPage = 1 }) => {
    const [lowStockData, setLowStockData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [allLowStockData, setAllLowStockData] = useState([]); // Store all data for filtering
    const [clientCurrentPage, setClientCurrentPage] = useState(1); // Client-side pagination
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10; // Fixed items per page
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [isIndeterminate, setIsIndeterminate] = useState(false);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentSort, setCurrentSort] = useState({ column: null, direction: null });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        skuSearch: '',
        nameSearch: '',
        quantityMin: '',
        quantityMax: '',
        status: ''
    });

    // Storage key for selected items
    const STORAGE_KEY = 'lowstock_selected_items';

    // Function to toggle filter modal and dispatch events
    const toggleFilterModal = (isOpen) => {
        setShowFilterModal(isOpen);
        // Dispatch event to update button state in parent page
        window.dispatchEvent(new CustomEvent('filterModalStateChange', { 
            detail: { isOpen } 
        }));
    };

    // Load selected items from localStorage
    const loadSelectedItems = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const selectedIds = JSON.parse(stored);
                setSelectedItems(new Set(selectedIds));
            }
        } catch (error) {
            console.error('Error loading selected items:', error);
        }
    }, []);

    // Save selected items to localStorage
    const saveSelectedItems = useCallback((selectedSet) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedSet]));
        } catch (error) {
            console.error('Error saving selected items:', error);
        }
    }, []);

    // Update select all state based on current page selections
    const updateSelectAllState = useCallback(() => {
        if (filteredData.length === 0) {
            setSelectAll(false);
            setIsIndeterminate(false);
            return;
        }

        const currentPageIds = filteredData.map(item => item.id);
        const selectedOnCurrentPage = currentPageIds.filter(id => selectedItems.has(id));
        
        if (selectedOnCurrentPage.length === 0) {
            setSelectAll(false);
            setIsIndeterminate(false);
        } else if (selectedOnCurrentPage.length === currentPageIds.length) {
            setSelectAll(true);
            setIsIndeterminate(false);
        } else {
            setSelectAll(false);
            setIsIndeterminate(true);
        }
    }, [filteredData, selectedItems]);

    // Handle individual item selection
    const handleItemSelect = useCallback((itemId, isChecked) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            if (isChecked) {
                newSelected.add(itemId);
            } else {
                newSelected.delete(itemId);
            }
            saveSelectedItems(newSelected);
            return newSelected;
        });
    }, [saveSelectedItems]);

    // Handle select all toggle
    const handleSelectAll = useCallback(() => {
        const currentPageIds = filteredData.map(item => item.id);
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            
            // Check if all items on current page are selected
            const allCurrentPageSelected = currentPageIds.every(id => newSelected.has(id));
            
            if (allCurrentPageSelected) {
                // If all are selected, unselect all items on current page
                currentPageIds.forEach(id => newSelected.delete(id));
            } else {
                // If not all are selected, select all items on current page
                currentPageIds.forEach(id => newSelected.add(id));
            }
            
            saveSelectedItems(newSelected);
            return newSelected;
        });
    }, [filteredData, saveSelectedItems]);

    // Clear all selections
    const clearAllSelections = useCallback(() => {
        setSelectedItems(new Set());
        localStorage.removeItem(STORAGE_KEY);
    }, [STORAGE_KEY]);

    // Function to fetch all low stock item IDs
    const fetchAllLowStockIds = async () => {
        try {
            const response = await fetch('/api/reports/lowstock?getAllIds=true');
            const result = await response.json();
            
            if (result.success) {
                return result.allIds || [];
            } else {
                console.error('Failed to fetch all IDs:', result.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching all IDs:', error);
            return [];
        }
    };

    // Handle single button select/unselect all
    const handleToggleSelectAll = useCallback(async () => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            
            // If any items are selected globally, clear ALL selections
            if (newSelected.size > 0) {
                newSelected.clear();
                saveSelectedItems(newSelected);
                return newSelected;
            } else {
                // If no items are selected, we need to select ALL items across all pages
                // We'll do this asynchronously
                return newSelected; // Return current state for now
            }
        });

        // If no items were selected, fetch all IDs and select them
        if (selectedItems.size === 0) {
            const allIds = await fetchAllLowStockIds();
            if (allIds.length > 0) {
                const newSelected = new Set(allIds);
                setSelectedItems(newSelected);
                saveSelectedItems(newSelected);
            }
        }
    }, [selectedItems, saveSelectedItems, fetchAllLowStockIds]);

    // Get selected items count
    const getSelectedCount = useCallback(() => {
        return selectedItems.size;
    }, [selectedItems]);

    // Handle column sorting - three states: asc → desc → default
    const handleSort = useCallback((column) => {
        let direction = 'asc';
        
        if (currentSort.column === column) {
            if (currentSort.direction === 'asc') {
                direction = 'desc';
            } else if (currentSort.direction === 'desc') {
                // Reset to default state (no sort)
                setCurrentSort({ column: null, direction: null });
                setLowStockData(allLowStockData);
                applyFiltersToSortedData(allLowStockData);
                setClientCurrentPage(1); // Reset to first page
                return;
            }
        }
        
        setCurrentSort({ column, direction });
        setClientCurrentPage(1); // Reset to first page when sorting
        
        // Sort all low stock data
        const sorted = [...allLowStockData].sort((a, b) => {
            let aValue = a[column];
            let bValue = b[column];
            
            // Handle numeric sorting for quantity, minimum, and toOrder
            if (['quantity', 'minimum', 'toOrder'].includes(column)) {
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
            } else {
                // Handle string sorting
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Update the main low stock data with sorted data
        setLowStockData(sorted);
        
        // Apply current filters to the sorted data
        applyFiltersToSortedData(sorted);
    }, [currentSort, allLowStockData]);

    // Filter function
    const applyFilters = () => {
        applyFiltersToSortedData(lowStockData);
        setClientCurrentPage(1); // Reset to first page when filtering
        toggleFilterModal(false);
    };

    // Apply filters to sorted data (helper function)
    const applyFiltersToSortedData = (dataToFilter) => {
        let filtered = [...dataToFilter];
        
        // SKU search
        if (filters.skuSearch) {
            filtered = filtered.filter(item => 
                item.sku.toLowerCase().includes(filters.skuSearch.toLowerCase())
            );
        }
        
        // Name search
        if (filters.nameSearch) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(filters.nameSearch.toLowerCase())
            );
        }
        
        // Quantity range
        if (filters.quantityMin) {
            filtered = filtered.filter(item => item.quantity >= parseInt(filters.quantityMin));
        }
        if (filters.quantityMax) {
            filtered = filtered.filter(item => item.quantity <= parseInt(filters.quantityMax));
        }
        
        // Status filter
        if (filters.status) {
            filtered = filtered.filter(item => item.status === filters.status);
        }
        
        setFilteredData(filtered);
        setTotalItems(filtered.length);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        
        // Reset to first page when filtering
        setClientCurrentPage(1);
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            skuSearch: '',
            nameSearch: '',
            quantityMin: '',
            quantityMax: '',
            status: ''
        });
        // Apply cleared filters to current low stock data (which might be sorted)
        setFilteredData(lowStockData);
        setTotalItems(lowStockData.length);
        setTotalPages(Math.ceil(lowStockData.length / itemsPerPage));
        
        // Reset to first page when clearing filters
        setClientCurrentPage(1);
    };

    // Sort the data based on current sort field and direction
    const sortedData = useMemo(() => {
        if (!currentSort.column || !currentSort.direction) return filteredData;
        
        return [...filteredData].sort((a, b) => {
            let aValue = a[currentSort.column];
            let bValue = b[currentSort.column];
            
            // Handle numeric sorting for quantity, minimum, and toOrder
            if (['quantity', 'minimum', 'toOrder'].includes(currentSort.column)) {
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
            } else {
                // Handle string sorting
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
            }
            
            if (aValue < bValue) return currentSort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, currentSort]);

    // Get sort icon with three states - matching inventory table
    const getSortIcon = (column) => {
        if (currentSort.column !== column || currentSort.direction === null) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
            );
        }
        
        if (currentSort.direction === 'asc') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15" />
                </svg>
            );
        } else {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9L12 5.25 15.75 9" />
                </svg>
            );
        }
    };

    // Function to get status styling using themed colors
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Low':
            case 'Low Stock':
                return 'text-orange bg-orange/10';
            case 'Out of stock':
            case 'Out of Stock':
                return 'text-red bg-red/10';
            default:
                return 'text-textColor-tertiary bg-textColor-tertiary/10';
        }
    };

    // Fetch low stock data
    const fetchLowStockData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Always fetch all data for client-side filtering and pagination (like inventory table)
            const response = await fetch(`/api/reports/lowstock?page=1&limit=1000`); // Large limit to get all data
            const result = await response.json();
            
            console.log('Low stock API response:', result);
            
            if (result.success) {
                const fetchedData = result.data || [];
                console.log(`Fetched ${fetchedData.length} low stock items`);
                setAllLowStockData(fetchedData);
                setLowStockData(fetchedData);
                setFilteredData(fetchedData);
                setTotalItems(fetchedData.length);
                setTotalPages(Math.ceil(fetchedData.length / itemsPerPage));
            } else {
                setError(result.error || 'Failed to fetch low stock data');
            }
        } catch (err) {
            console.error('Error fetching low stock data:', err);
            setError('Failed to connect to database');
        } finally {
            setLoading(false);
        }
    };

    // Client-side pagination functions
    const getDisplayData = () => {
        const startIndex = (clientCurrentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    const goToPage = (page) => {
        setClientCurrentPage(page);
        // Dispatch event to notify Astro page of pagination change
        setTimeout(() => {
            const paginationData = {
                currentPage: page,
                totalPages,
                totalItems,
                startIndex: ((page - 1) * itemsPerPage) + 1,
                endIndex: Math.min(page * itemsPerPage, totalItems),
                itemsPerPage
            };
            window.dispatchEvent(new CustomEvent('lowStockPaginationUpdate', { detail: paginationData }));
        }, 50);
    };

    const goToPreviousPage = () => {
        if (clientCurrentPage > 1) {
            const newPage = clientCurrentPage - 1;
            setClientCurrentPage(newPage);
            // Dispatch event to notify Astro page of pagination change
            setTimeout(() => {
                const paginationData = {
                    currentPage: newPage,
                    totalPages,
                    totalItems,
                    startIndex: ((newPage - 1) * itemsPerPage) + 1,
                    endIndex: Math.min(newPage * itemsPerPage, totalItems),
                    itemsPerPage
                };
                window.dispatchEvent(new CustomEvent('lowStockPaginationUpdate', { detail: paginationData }));
            }, 50);
        }
    };

    const goToNextPage = () => {
        if (clientCurrentPage < totalPages) {
            const newPage = clientCurrentPage + 1;
            setClientCurrentPage(newPage);
            // Dispatch event to notify Astro page of pagination change
            setTimeout(() => {
                const paginationData = {
                    currentPage: newPage,
                    totalPages,
                    totalItems,
                    startIndex: ((newPage - 1) * itemsPerPage) + 1,
                    endIndex: Math.min(newPage * itemsPerPage, totalItems),
                    itemsPerPage
                };
                window.dispatchEvent(new CustomEvent('lowStockPaginationUpdate', { detail: paginationData }));
            }, 50);
        }
    };

    // Expose pagination data to parent Astro page
    useEffect(() => {
        window.lowStockPagination = {
            currentPage: clientCurrentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            hasNextPage: clientCurrentPage < totalPages,
            hasPrevPage: clientCurrentPage > 1,
            goToPage,
            goToPreviousPage,
            goToNextPage,
            getDisplayData
        };
        
        // Dispatch event to notify Astro page of pagination data update
        setTimeout(() => {
            const paginationData = {
                currentPage: clientCurrentPage,
                totalPages,
                totalItems,
                startIndex: ((clientCurrentPage - 1) * itemsPerPage) + 1,
                endIndex: Math.min(clientCurrentPage * itemsPerPage, totalItems),
                itemsPerPage
            };
            window.dispatchEvent(new CustomEvent('lowStockPaginationUpdate', { detail: paginationData }));
        }, 100);
    }, [clientCurrentPage, totalPages, totalItems, goToPage, goToPreviousPage, goToNextPage]);

    useEffect(() => {
        fetchLowStockData();
    }, []); // Remove currentPage dependency since we're fetching all data

    // Listen for filter modal open event from parent page
    useEffect(() => {
        const handleOpenFilterModal = () => {
            toggleFilterModal(true);
        };
        
        const handleChangePage = (event) => {
            const { page } = event.detail;
            if (page && page !== clientCurrentPage) {
                setClientCurrentPage(page);
            }
        };
        
        window.addEventListener('openFilterModal', handleOpenFilterModal);
        window.addEventListener('lowStockChangePage', handleChangePage);
        
        return () => {
            window.removeEventListener('openFilterModal', handleOpenFilterModal);
            window.removeEventListener('lowStockChangePage', handleChangePage);
        };
    }, [clientCurrentPage]);

    // Handle sorting after data is loaded
    useEffect(() => {
        if (currentSort.column && lowStockData.length > 0) {
            const sorted = [...lowStockData].sort((a, b) => {
                let aValue = a[currentSort.column];
                let bValue = b[currentSort.column];
                
                // Handle numeric sorting for quantity, minimum, and toOrder
                if (['quantity', 'minimum', 'toOrder'].includes(currentSort.column)) {
                    aValue = parseInt(aValue) || 0;
                    bValue = parseInt(bValue) || 0;
                } else {
                    // Handle string sorting
                    aValue = String(aValue || '').toLowerCase();
                    bValue = String(bValue || '').toLowerCase();
                }
                
                if (aValue < bValue) return currentSort.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
            
            setLowStockData(sorted);
            applyFiltersToSortedData(sorted);
        }
    }, [allLowStockData, currentSort]);

    // Load selected items on component mount
    useEffect(() => {
        loadSelectedItems();
    }, [loadSelectedItems]);

    // Update select all state when data or selections change
    useEffect(() => {
        updateSelectAllState();
    }, [updateSelectAllState]);

    // Expose functions to parent component via global object
    useEffect(() => {
        window.lowStockTable = {
            getSelectedCount,
            clearAllSelections,
            handleSelectAll,
            handleToggleSelectAll,
            selectedItems: [...selectedItems]
        };
    }, [getSelectedCount, clearAllSelections, handleSelectAll, handleToggleSelectAll, selectedItems]);

    if (loading) {
        return (
            <div className="h-full overflow-y-auto">
                {/* Skeleton Table */}
                <div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-textColor-primary border-b border-gray-700">
                                <th className="text-left py-3 px-4 font-medium w-[5%]">
                                    <input type="checkbox" className="rounded bg-gray-700 border-gray-600 pointer-events-none" disabled />
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">
                                    <button className="flex items-center gap-1">
                                        SKU
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                                        </svg>
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[18%]">
                                    <button className="flex items-center gap-1">
                                        Name
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                                        </svg>
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">
                                    <button className="flex items-center gap-1">
                                        Quantity
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                                        </svg>
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">
                                    <button className="flex items-center gap-1">
                                        Minimum
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                                        </svg>
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">
                                    <button className="flex items-center gap-1">
                                        To Order
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                                        </svg>
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">
                                    <button className="flex items-center gap-1">
                                        Status
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                                        </svg>
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[12%]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(10)].map((_, index) => (
                                <tr key={index} className={`border-b border-gray-800 ${index === 9 ? 'border-b-0' : ''}`}>
                                    <td className="py-4 px-4">
                                        <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="h-4 bg-gray-700 rounded animate-pulse w-20"></div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="h-4 bg-gray-700 rounded animate-pulse w-32"></div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="h-4 bg-gray-700 rounded animate-pulse w-12"></div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="h-4 bg-gray-700 rounded animate-pulse w-12"></div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="h-4 bg-gray-700 rounded animate-pulse w-12"></div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="h-4 bg-gray-700 rounded animate-pulse w-16"></div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="h-6 bg-gray-700 rounded animate-pulse w-12"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="text-center py-8">
                    <div className="text-red-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <p className="text-textColor-primary text-lg font-medium mb-2">Error Loading Data</p>
                    <p className="text-textColor-tertiary">{error}</p>
                    <button 
                        onClick={fetchLowStockData}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (lowStockData.length === 0) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="text-center py-8">
                    <div className="text-green-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-textColor-primary text-lg font-medium mb-2">All Items Well Stocked</p>
                    <p className="text-textColor-tertiary">No items are currently low in stock or out of stock.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-y-auto">
                {/* Low Stock Table */}
                <div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-textColor-primary border-b border-gray-700">
                                <th className="text-left py-3 px-4 font-medium w-[5%]">
                                    <input 
                                        type="checkbox" 
                                        id="selectAllHeader" 
                                        className="rounded bg-gray-700 border-gray-600" 
                                        checked={selectAll}
                                        ref={input => {
                                            if (input) input.indeterminate = isIndeterminate;
                                        }}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">
                                    <button 
                                        onClick={() => handleSort('sku')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'sku' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        SKU
                                        {getSortIcon('sku')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[18%]">
                                    <button 
                                        onClick={() => handleSort('name')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'name' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Name
                                        {getSortIcon('name')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">
                                    <button 
                                        onClick={() => handleSort('quantity')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'quantity' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Quantity
                                        {getSortIcon('quantity')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">
                                    <button 
                                        onClick={() => handleSort('minimum')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'minimum' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Minimum
                                        {getSortIcon('minimum')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">
                                    <button 
                                        onClick={() => handleSort('toOrder')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'toOrder' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        To Order
                                        {getSortIcon('toOrder')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">
                                    <button 
                                        onClick={() => handleSort('status')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'status' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Status
                                        {getSortIcon('status')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[12%]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Render actual data rows */}
                            {getDisplayData().map((item, index) => (
                                <tr key={item.id} className={`border-b border-gray-800 hover:bg-tbl-hover ${index === 9 ? 'border-b-0' : ''}`}>
                                    <td className="py-4 px-4">
                                        <input 
                                            type="checkbox" 
                                            className="item-checkbox rounded bg-gray-700 border-gray-600" 
                                            checked={selectedItems.has(item.id)}
                                            onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                                        />
                                    </td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.sku}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.name}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.quantity}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.minimum}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.toOrder}</td>
                                    <td className="py-4 px-4">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusStyle(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <button 
                                            data-item-code={item.sku} 
                                            data-item-name={item.name} 
                                            data-current-qty={item.quantity} 
                                            data-order-qty={item.toOrder} 
                                            className="edit-btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* Fill empty rows to always have 10 rows total */}
                            {[...Array(Math.max(0, 10 - getDisplayData().length))].map((_, index) => (
                                <tr key={`empty-${index}`} className={`border-b border-gray-800 ${(getDisplayData().length + index) === 9 ? 'border-b-0' : ''}`}>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div 
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    onClick={() => toggleFilterModal(false)}
                >
                    <div 
                        className="bg-primary rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-textColor-primary text-lg font-semibold">Filter Low Stock Items</h3>
                            <button 
                                onClick={() => toggleFilterModal(false)}
                                className="p-2 text-textColor-primary hover:bg-btn-hover hover:text-white rounded"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* SKU Search */}
                            <div>
                                <label className="block text-textColor-primary text-sm font-medium mb-2">SKU:</label>
                                <input 
                                    type="text"
                                    value={filters.skuSearch}
                                    onChange={(e) => setFilters({...filters, skuSearch: e.target.value})}
                                    placeholder="Search by SKU"
                                    className="w-full px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-blue-500 text-sm"
                                />
                            </div>
                            
                            {/* Item Name Search */}
                            <div>
                                <label className="block text-textColor-primary text-sm font-medium mb-2">Item Name:</label>
                                <input 
                                    type="text"
                                    value={filters.nameSearch}
                                    onChange={(e) => setFilters({...filters, nameSearch: e.target.value})}
                                    placeholder="Search by item name"
                                    className="w-full px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-blue-500 text-sm"
                                />
                            </div>
                            
                            {/* Quantity Range */}
                            <div>
                                <label className="block text-textColor-primary text-sm font-medium mb-2">Quantity Range:</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number"
                                        value={filters.quantityMin}
                                        onChange={(e) => setFilters({...filters, quantityMin: e.target.value})}
                                        placeholder="Min"
                                        className="flex-1 px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-blue-500 text-sm"
                                    />
                                    <span className="text-textColor-tertiary">to</span>
                                    <input 
                                        type="number"
                                        value={filters.quantityMax}
                                        onChange={(e) => setFilters({...filters, quantityMax: e.target.value})}
                                        placeholder="Max"
                                        className="flex-1 px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            
                            {/* Status Filter */}
                            <div>
                                <label className="block text-textColor-primary text-sm font-medium mb-2">Status:</label>
                                <select 
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                                    className="w-full px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-blue-500 text-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="Low">Low</option>
                                    <option value="Out of stock">Out of stock</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button 
                                onClick={clearFilters}
                                className="flex-1 bg-background hover:bg-textColor-tertiary text-textColor-primary px-4 py-2 rounded font-medium transition-colors"
                            >
                                Clear All
                            </button>
                            <button 
                                onClick={applyFilters}
                                className="flex-1 bg-btn-primary hover:bg-btn-hover text-white px-4 py-2 rounded font-medium transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </>
    );
};

export default LowStockTable;