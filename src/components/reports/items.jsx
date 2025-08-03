import { useState, useEffect } from 'react';

const InventoryTable = ({ itemsPerPage: initialItemsPerPage = 10 }) => {
    const [inventoryData, setInventoryData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [allInventoryData, setAllInventoryData] = useState([]); // Store all data
    const [currentPage, setCurrentPage] = useState(1); // Client-side pagination
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    
    // Sorting and filtering states
    const [currentSort, setCurrentSort] = useState({ column: null, direction: 'asc' });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        codeSearch: '',
        nameSearch: '',
        currentQuantityMin: '',
        currentQuantityMax: '',
        status: ''
    });

    // Function to toggle filter modal and dispatch events
    const toggleFilterModal = (isOpen) => {
        setShowFilterModal(isOpen);
        // Dispatch event to update button state in parent page
        window.dispatchEvent(new CustomEvent('filterModalStateChange', { 
            detail: { isOpen } 
        }));
    };

    // Function to get status styling using themed colors
    const getStatusStyle = (status) => {
        switch (status) {
            case 'OK':
                return 'text-green bg-green/10';
            case 'LOW':
                return 'text-orange bg-orange/10';
            case 'OUT OF STOCK':
                return 'text-red bg-red/10';
            default:
                return 'text-textColor-tertiary bg-textColor-tertiary/10';
        }
    };

    // Fetch inventory data - always fetch all data for client-side pagination
    const fetchInventoryData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Always fetch all data for client-side pagination
            const apiUrl = `/api/reports/items?limit=1000`; // Large limit to get all data
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            const fetchedData = result.data || [];
            
            // Store all data
            setAllInventoryData(fetchedData);
            setInventoryData(fetchedData);
            setFilteredData(fetchedData);
            setTotalItems(fetchedData.length);
            setTotalPages(Math.ceil(fetchedData.length / itemsPerPage));
            
        } catch (err) {
            console.error('Failed to fetch inventory data:', err);
            setError(err.message);
            
            // Fallback to mock data for development
            const mockData = [
                { id: 1, code: 'PRD001', name: 'Laptop Computer', current: 50, min: 20, max: 100, status: 'OK', isVisible: true },
                { id: 2, code: 'PRD002', name: 'Office Chair', current: 15, min: 20, max: 100, status: 'LOW', isVisible: true },
                { id: 3, code: 'PRD003', name: 'Wireless Mouse', current: 0, min: 10, max: 200, status: 'OUT OF STOCK', isVisible: true },
                { id: 4, code: 'PRD004', name: 'Monitor Display', current: 75, min: 30, max: 150, status: 'OK', isVisible: true },
                { id: 5, code: 'PRD005', name: 'Keyboard', current: 8, min: 15, max: 80, status: 'LOW', isVisible: true },
                { id: 6, code: 'PRD006', name: 'Desk Lamp', current: 120, min: 25, max: 200, status: 'OK', isVisible: true },
                { id: 7, code: 'PRD007', name: 'USB Cable', current: 200, min: 50, max: 300, status: 'OK', isVisible: true },
                { id: 8, code: 'PRD008', name: 'Phone Charger', current: 5, min: 20, max: 100, status: 'LOW', isVisible: true },
                { id: 9, code: 'PRD009', name: 'Tablet Stand', current: 0, min: 10, max: 50, status: 'OUT OF STOCK', isVisible: true },
                { id: 10, code: 'PRD010', name: 'Webcam', current: 30, min: 15, max: 60, status: 'OK', isVisible: true },
                { id: 11, code: 'PRD011', name: 'Headphones', current: 12, min: 20, max: 80, status: 'LOW', isVisible: true },
                { id: 12, code: 'PRD012', name: 'Printer Paper', current: 150, min: 100, max: 500, status: 'OK', isVisible: true },
                // Add more mock data to test pagination
                { id: 13, code: 'PRD013', name: 'USB Drive', current: 35, min: 25, max: 100, status: 'OK', isVisible: true },
                { id: 14, code: 'PRD014', name: 'Network Cable', current: 45, min: 30, max: 150, status: 'OK', isVisible: true },
                { id: 15, code: 'PRD015', name: 'Power Strip', current: 8, min: 15, max: 50, status: 'LOW', isVisible: true },
                { id: 16, code: 'PRD016', name: 'Ethernet Switch', current: 22, min: 10, max: 40, status: 'OK', isVisible: true },
                { id: 17, code: 'PRD017', name: 'Router', current: 0, min: 5, max: 20, status: 'OUT OF STOCK', isVisible: true },
                { id: 18, code: 'PRD018', name: 'Wireless Adapter', current: 18, min: 20, max: 60, status: 'LOW', isVisible: true },
                { id: 19, code: 'PRD019', name: 'Bluetooth Speaker', current: 25, min: 15, max: 80, status: 'OK', isVisible: true },
                { id: 20, code: 'PRD020', name: 'External Hard Drive', current: 12, min: 10, max: 30, status: 'OK', isVisible: true },
                { id: 21, code: 'PRD021', name: 'Wireless Keyboard', current: 7, min: 15, max: 50, status: 'LOW', isVisible: true },
                { id: 22, code: 'PRD022', name: 'Gaming Mouse', current: 33, min: 20, max: 75, status: 'OK', isVisible: true },
                { id: 23, code: 'PRD023', name: 'Monitor Stand', current: 0, min: 10, max: 30, status: 'OUT OF STOCK', isVisible: true },
                { id: 24, code: 'PRD024', name: 'Desk Organizer', current: 28, min: 15, max: 60, status: 'OK', isVisible: true },
                { id: 25, code: 'PRD025', name: 'Cable Management', current: 41, min: 25, max: 100, status: 'OK', isVisible: true },
            ];
            setAllInventoryData(mockData);
            setInventoryData(mockData);
            setFilteredData(mockData);
            setTotalPages(Math.ceil(mockData.length / itemsPerPage));
            setTotalItems(mockData.length);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryData();
    }, []); // Only fetch once on component mount

    // Handle sorting after data is loaded
    useEffect(() => {
        if (currentSort.column && inventoryData.length > 0) {
            const sorted = [...inventoryData].sort((a, b) => {
                let aValue = a[currentSort.column];
                let bValue = b[currentSort.column];
                
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }
                
                if (aValue < bValue) return currentSort.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
            
            setInventoryData(sorted);
            applyFiltersToSortedData(sorted);
        }
    }, [allInventoryData, currentSort]);

        // Add event listener for external filter button
    useEffect(() => {
        const handleOpenFilterModal = () => {
            toggleFilterModal(true);
        };

        window.addEventListener('openFilterModal', handleOpenFilterModal);
        
        return () => {
            window.removeEventListener('openFilterModal', handleOpenFilterModal);
        };
    }, []);

    // Sort function with three states: asc → desc → default
    const handleSort = (column) => {
        let direction = 'asc';
        
        if (currentSort.column === column) {
            if (currentSort.direction === 'asc') {
                direction = 'desc';
            } else if (currentSort.direction === 'desc') {
                // Reset to default state (no sort)
                setCurrentSort({ column: null, direction: null });
                setInventoryData(allInventoryData);
                applyFiltersToSortedData(allInventoryData);
                setCurrentPage(1); // Reset to first page
                return;
            }
        }
        
        setCurrentSort({ column, direction });
        setCurrentPage(1); // Reset to first page when sorting
        
        // Sort all inventory data
        const sorted = [...allInventoryData].sort((a, b) => {
            let aValue = a[column];
            let bValue = b[column];
            
            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Update the main inventory data with sorted data
        setInventoryData(sorted);
        
        // Apply current filters to the sorted data
        applyFiltersToSortedData(sorted);
    };

    // Filter function
    const applyFilters = () => {
        applyFiltersToSortedData(inventoryData);
        setCurrentPage(1); // Reset to first page when filtering
        toggleFilterModal(false);
    };

    // Apply filters to sorted data (helper function)
    const applyFiltersToSortedData = (dataToFilter) => {
        let filtered = [...dataToFilter];
        
        // Item Code search
        if (filters.codeSearch) {
            filtered = filtered.filter(item => 
                item.code.toLowerCase().includes(filters.codeSearch.toLowerCase())
            );
        }
        
        // Item Name search
        if (filters.nameSearch) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(filters.nameSearch.toLowerCase())
            );
        }
        
        // Current quantity range
        if (filters.currentQuantityMin) {
            filtered = filtered.filter(item => item.current >= parseInt(filters.currentQuantityMin));
        }
        if (filters.currentQuantityMax) {
            filtered = filtered.filter(item => item.current <= parseInt(filters.currentQuantityMax));
        }
        
        // Status filter
        if (filters.status) {
            filtered = filtered.filter(item => item.status === filters.status);
        }
        
        setFilteredData(filtered);
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            codeSearch: '',
            nameSearch: '',
            currentQuantityMin: '',
            currentQuantityMax: '',
            status: ''
        });
        // Apply cleared filters to current inventory data (which might be sorted)
        setFilteredData(inventoryData);
        setCurrentPage(1); // Reset to first page when clearing filters
    };

    // Get sort icon with three states
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

    // Client-side pagination functions
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Handle items per page change
    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    // Generate pagination pages array
    const generatePaginationPages = (currentPage, totalPages) => {
        const pages = [];
        
        // If 7 or fewer pages, show all
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }
        
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
        
        return pages;
    };

    // Create exactly 10 rows (fill with empty invisible rows if needed)
    // Always use client-side pagination
    const getDisplayData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    const displayData = getDisplayData();
    const tableRows = [];
    for (let i = 0; i < itemsPerPage; i++) {
        if (i < displayData.length) {
            tableRows.push(displayData[i]);
        } else {
            tableRows.push({
                id: null,
                code: '',
                name: '',
                current: 0,
                min: 0,
                max: 0,
                status: '',
                isVisible: false
            });
        }
    }

    // Calculate pagination info
    const startIndex = (currentPage - 1) * itemsPerPage;
    const displayDataLength = displayData.length;
    const totalFilteredItems = filteredData.length;
    const endIndex = Math.min(startIndex + displayDataLength, startIndex + itemsPerPage);
    const startItem = totalFilteredItems > 0 ? startIndex + 1 : 0;
    const endItem = Math.min(startIndex + displayDataLength, totalFilteredItems);
    
    // Calculate total pages based on filtered data
    const calculatedTotalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;
    
    const paginationPages = generatePaginationPages(currentPage, calculatedTotalPages);

    if (loading) {
        return (
            <>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm table-fixed">
                            <thead className="sticky top-0 bg-primary">
                                <tr className="text-textColor-primary border-b border-gray-700">
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">
                                        <button 
                                            onClick={() => handleSort('code')}
                                            className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'code' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                        >
                                            Item Code
                                            {getSortIcon('code')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium w-[25%]">
                                        <button 
                                            onClick={() => handleSort('name')}
                                            className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'name' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                        >
                                            Item Name
                                            {getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">
                                        <button 
                                            onClick={() => handleSort('current')}
                                            className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'current' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                        >
                                            Current
                                            {getSortIcon('current')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">
                                        <button 
                                            onClick={() => handleSort('min')}
                                            className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'min' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                        >
                                            Min
                                            {getSortIcon('min')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">
                                        <button 
                                            onClick={() => handleSort('max')}
                                            className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'max' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                        >
                                            Max
                                            {getSortIcon('max')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">
                                        <button 
                                            onClick={() => handleSort('status')}
                                            className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'status' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                        >
                                            Status
                                            {getSortIcon('status')}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="min-h-[500px]">
                                {Array.from({ length: 10 }, (_, index) => (
                                    <tr 
                                        key={`loading-${index}`}
                                        className="border-b border-gray-800 h-[50px]"
                                        style={{ height: '50px' }}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-16 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-24 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-12 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-12 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-12 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-6 w-16 rounded"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
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
                            <h3 className="text-textColor-primary text-lg font-semibold">Filter Inventory</h3>
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
                            {/* Item Code Search */}
                            <div>
                                <label className="block text-textColor-primary text-sm font-medium mb-2">Item Code:</label>
                                <input 
                                    type="text"
                                    value={filters.codeSearch}
                                    onChange={(e) => setFilters({...filters, codeSearch: e.target.value})}
                                    placeholder="Search by item code"
                                    className="w-full px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-btn-primary text-sm"
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
                                    className="w-full px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-btn-primary text-sm"
                                />
                            </div>
                            
                            {/* Current Quantity Range */}
                            <div>
                                <label className="block text-textColor-primary text-sm font-medium mb-2">Current Quantity Range:</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number"
                                        value={filters.currentQuantityMin}
                                        onChange={(e) => setFilters({...filters, currentQuantityMin: e.target.value})}
                                        placeholder="Min"
                                        className="flex-1 px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-btn-primary text-sm"
                                    />
                                    <span className="text-textColor-tertiary">to</span>
                                    <input 
                                        type="number"
                                        value={filters.currentQuantityMax}
                                        onChange={(e) => setFilters({...filters, currentQuantityMax: e.target.value})}
                                        placeholder="Max"
                                        className="flex-1 px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-btn-primary text-sm"
                                    />
                                </div>
                            </div>
                            
                            {/* Status Filter */}
                            <div>
                                <label className="block text-textColor-primary text-sm font-medium mb-2">Status:</label>
                                <select 
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                                    className="w-full px-3 py-2 bg-background text-textColor-primary rounded border border-textColor-tertiary focus:border-btn-primary text-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="OK">OK</option>
                                    <option value="LOW">LOW</option>
                                    <option value="OUT OF STOCK">OUT OF STOCK</option>
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

            {error && (
                <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
                    <p className="text-red-400 text-sm">
                        <strong>Database Connection Error:</strong> {error}
                        <br />
                        <span className="text-red-300">Showing fallback data for development.</span>
                    </p>
                </div>
            )}
            
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm table-fixed">
                        <thead className="sticky top-0 bg-primary">
                            <tr className="text-textColor-primary border-b border-gray-700">
                                <th className="text-left py-3 px-4 font-medium w-[15%]">
                                    <button 
                                        onClick={() => handleSort('code')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'code' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Item Code
                                        {getSortIcon('code')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[25%]">
                                    <button 
                                        onClick={() => handleSort('name')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'name' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Item Name
                                        {getSortIcon('name')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">
                                    <button 
                                        onClick={() => handleSort('current')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'current' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Current
                                        {getSortIcon('current')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">
                                    <button 
                                        onClick={() => handleSort('min')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'min' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Min
                                        {getSortIcon('min')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">
                                    <button 
                                        onClick={() => handleSort('max')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'max' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Max
                                        {getSortIcon('max')}
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">
                                    <button 
                                        onClick={() => handleSort('status')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${currentSort.column === 'status' && currentSort.direction !== null ? 'text-btn-primary' : ''}`}
                                    >
                                        Status
                                        {getSortIcon('status')}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="min-h-[500px]">
                            {tableRows.map((item, index) => (
                                <tr 
                                    key={item.id || `empty-${index}`}
                                    className={`border-b border-gray-800 hover:bg-tbl-hover h-[50px] ${item.isVisible ? '' : 'invisible'} ${index === 9 ? 'border-b-0' : ''}`}
                                    style={{ height: '50px' }}
                                >
                                    <td className="py-4 px-4 text-textColor-primary">{item.code}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.name}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.isVisible ? item.current : ''}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.isVisible ? item.min : ''}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.isVisible ? item.max : ''}</td>
                                    <td className="py-4 px-4">
                                        {item.isVisible && (
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusStyle(item.status)}`}>
                                                {item.status}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Client-side Pagination Section */}
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
                        {/* Dynamic options based on data length */}
                        {totalFilteredItems > 5 && <option value={5}>5</option>}
                        {totalFilteredItems > 10 && <option value={10}>10</option>}
                        {totalFilteredItems > 20 && <option value={20}>20</option>}
                        {totalFilteredItems > 50 && <option value={50}>50</option>}
                        {totalFilteredItems > 100 && <option value={100}>100</option>}
                        <option value={totalFilteredItems}>All</option>
                    </select>
                    <span className="text-textColor-tertiary">
                        Showing {Math.min(startIndex + 1, totalFilteredItems)}-{Math.min(endIndex, totalFilteredItems)} of {totalFilteredItems} items
                    </span>
                </div>
                
                {/* Pagination Controls */}
                {totalFilteredItems > 0 && calculatedTotalPages > 1 && (
                    <div className="flex items-center gap-1">
                        {/* Previous Button */}
                        <button 
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-md transition-colors ${
                                currentPage > 1
                                    ? 'text-textColor-primary hover:bg-gray-700' 
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
                            onClick={goToNextPage}
                            disabled={currentPage === calculatedTotalPages}
                            className={`p-2 rounded-md transition-colors ${
                                currentPage < calculatedTotalPages
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
                
                {/* Show page 1 when "All" is selected */}
                {totalFilteredItems > 0 && calculatedTotalPages <= 1 && (
                    <div className="flex items-center gap-1">
                        <button 
                            className="px-3 py-2 rounded-md text-sm font-medium bg-btn-primary text-white"
                        >
                            1
                        </button>
                    </div>
                )}
                
                {/* Empty space when no data to maintain layout */}
                {totalFilteredItems === 0 && (
                    <div></div>
                )}
            </div>
        </div>
    );
};

export default InventoryTable;
