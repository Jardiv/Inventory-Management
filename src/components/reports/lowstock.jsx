import { useState, useEffect, useCallback } from 'react';

const LowStockTable = ({ currentPage = 1 }) => {
    const [lowStockData, setLowStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [isIndeterminate, setIsIndeterminate] = useState(false);

    // Storage key for selected items
    const STORAGE_KEY = 'lowstock_selected_items';

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
        if (lowStockData.length === 0) {
            setSelectAll(false);
            setIsIndeterminate(false);
            return;
        }

        const currentPageIds = lowStockData.map(item => item.id);
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
    }, [lowStockData, selectedItems]);

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
        const currentPageIds = lowStockData.map(item => item.id);
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
    }, [lowStockData, saveSelectedItems]);

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
    const fetchLowStockData = async (page = currentPage) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/reports/lowstock?page=${page}`);
            const result = await response.json();
            
            if (result.success) {
                setLowStockData(result.data);
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

    useEffect(() => {
        fetchLowStockData(currentPage);
    }, [currentPage]);

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
                                <th className="text-left py-3 px-4 font-medium w-[15%]">SKU</th>
                                <th className="text-left py-3 px-4 font-medium w-[18%]">Name</th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">Quantity</th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">Minimum</th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">To Order</th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">Status</th>
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
                                <th className="text-left py-3 px-4 font-medium w-[15%]">SKU</th>
                                <th className="text-left py-3 px-4 font-medium w-[18%]">Name</th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">Quantity</th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">Minimum</th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">To Order</th>
                                <th className="text-left py-3 px-4 font-medium w-[10%]">Status</th>
                                <th className="text-left py-3 px-4 font-medium w-[12%]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Render actual data rows */}
                            {lowStockData.map((item, index) => (
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
                            {[...Array(Math.max(0, 10 - lowStockData.length))].map((_, index) => (
                                <tr key={`empty-${index}`} className={`border-b border-gray-800 ${(lowStockData.length + index) === 9 ? 'border-b-0' : ''}`}>
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
            
        </>
    );
};

export default LowStockTable;
