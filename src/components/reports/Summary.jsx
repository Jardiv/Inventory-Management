import { useState, useEffect, useCallback } from 'react';

const DashboardSummary = ({ section }) => {
    const [data, setData] = useState({
        inventory: [],
        warehouse: [],
        lowstock: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({
        inventory: { column: null, direction: null },
        warehouse: { column: null, direction: null },
        lowstock: { column: null, direction: null }
    });

    // Map status to themed colors using CSS custom properties with backgrounds
    const getStatusColorClass = (status) => {
        switch (status) {
            case 'Normal':
            case 'Available':
                return 'text-green bg-green/10'; // Uses CSS custom property --color-green
            case 'Low Stock':
                return 'text-orange bg-orange/10'; // Uses CSS custom property --color-orange  
            case 'Out of Stock':
                return 'text-red bg-red/10'; // Uses CSS custom property --color-red
            case 'Full':
                return 'text-red bg-red/10'; // Uses CSS custom property --color-red
            case 'Critical':
                return 'text-orange bg-orange/10'; // Uses CSS custom property --color-orange
            case 'High':
                return 'text-orange bg-orange/10'; // Uses CSS custom property --color-orange
            case 'Medium':
                return 'text-blue bg-blue/10'; // Uses CSS custom property --color-blue
            default:
                return 'text-textColor-tertiary bg-textColor-tertiary/10'; // Fallback to tertiary text color
        }
    };

    // Three-state sorting handler
    const handleSort = useCallback((sectionName, column) => {
        setSortConfig(prev => ({
            ...prev,
            [sectionName]: {
                column: prev[sectionName].column === column && prev[sectionName].direction === 'desc' ? null : column,
                direction: prev[sectionName].column === column
                    ? prev[sectionName].direction === null ? 'asc'
                    : prev[sectionName].direction === 'asc' ? 'desc' : null
                    : 'asc'
            }
        }));
    }, []);

    // Sort data based on current sort configuration
    const getSortedData = useCallback((dataArray, sectionName) => {
        const config = sortConfig[sectionName];
        if (!config.column || !config.direction) {
            return dataArray;
        }

        return [...dataArray].sort((a, b) => {
            let aValue = a[config.column];
            let bValue = b[config.column];

            // Handle numeric columns
            if (['current', 'minimum', 'used', 'available', 'toOrder'].includes(config.column)) {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            } else {
                // String comparison (case insensitive)
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }

            if (aValue < bValue) {
                return config.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return config.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [sortConfig]);

    // Sort icon component
    const getSortIcon = (sectionName, column) => {
        const config = sortConfig[sectionName];
        if (config.column !== column || config.direction === null) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
            );
        }
        
        if (config.direction === 'asc') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
            );
        } else {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            );
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [section]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/reports/summary?section=${section || 'all'}`);
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to fetch dashboard data');
            }
        } catch (err) {
            setError('Network error occurred');
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Inventory Stock Section
    const InventorySection = () => {
        const inventoryData = getSortedData(data.inventory || [], 'inventory');
        const visibleRows = Math.min(8, inventoryData.length);
        const remainingRows = Math.max(0, inventoryData.length - visibleRows);
        
        const renderInventoryRows = () => {
            return Array.from({ length: 8 }, (_, index) => {
                const item = inventoryData[index];
                const isVisible = item && index < visibleRows;
                
                if (loading) {
                    return (
                        <tr key={index} className={index < 7 ? "border-b border-gray-800" : ""}>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-12"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-12"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-20"></div>
                            </td>
                        </tr>
                    );
                }

                return (
                    <tr key={index} className={`${index < 7 ? "border-b border-gray-800" : ""} ${!isVisible ? "opacity-0" : ""}`}>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? item.itemName : "Hidden Item"}
                        </td>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? item.current : "0"}
                        </td>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? item.minimum : "0"}
                        </td>
                        <td className="py-2 px-2">
                            {isVisible ? (
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColorClass(item.status)}`}>
                                    {item.status}
                                </span>
                            ) : (
                                <span className="text-gray-400 text-xs sm:text-sm">Hidden</span>
                            )}
                        </td>
                    </tr>
                );
            });
        };

        return (
            <div className="flex flex-col h-full">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-xs sm:text-sm">
                        <thead className="sticky top-0 bg-primary">
                            <tr className="text-textColor-primary border-b border-gray-700">
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('inventory', 'itemName')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.inventory.column === 'itemName' && sortConfig.inventory.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Item Name
                                        {getSortIcon('inventory', 'itemName')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('inventory', 'current')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.inventory.column === 'current' && sortConfig.inventory.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Current
                                        {getSortIcon('inventory', 'current')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('inventory', 'minimum')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.inventory.column === 'minimum' && sortConfig.inventory.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Minimum
                                        {getSortIcon('inventory', 'minimum')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('inventory', 'status')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.inventory.column === 'status' && sortConfig.inventory.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Status
                                        {getSortIcon('inventory', 'status')}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderInventoryRows()}
                        </tbody>
                    </table>
                </div>
                {!loading && remainingRows > 0 && (
                    <div className="flex justify-center py-2 pt-3">
                        <span className="text-textColor-tertiary text-xs">
                            +{remainingRows} more
                        </span>
                    </div>
                )}
            </div>
        );
    };

    // Warehouse Capacity Section
    const WarehouseSection = () => {
        const warehouseData = getSortedData(data.warehouse || [], 'warehouse');
        const visibleRows = Math.min(8, warehouseData.length);
        const remainingRows = Math.max(0, warehouseData.length - visibleRows);
        
        const renderWarehouseRows = () => {
            return Array.from({ length: 8 }, (_, index) => {
                const warehouse = warehouseData[index];
                const isVisible = warehouse && index < visibleRows;
                
                if (loading) {
                    return (
                        <tr key={index} className={index < 7 ? "border-b border-gray-800" : ""}>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-16"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-16"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-20"></div>
                            </td>
                        </tr>
                    );
                }

                return (
                    <tr key={index} className={`${index < 7 ? "border-b border-gray-800" : ""} ${!isVisible ? "opacity-0" : ""}`}>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? warehouse.warehouseName : "Hidden Warehouse"}
                        </td>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? warehouse.used.toLocaleString() : "0"}
                        </td>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? warehouse.available.toLocaleString() : "0"}
                        </td>
                        <td className="py-2 px-2">
                            {isVisible ? (
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColorClass(warehouse.status)}`}>
                                    {warehouse.status}
                                </span>
                            ) : (
                                <span className="text-gray-400 text-xs sm:text-sm">Hidden</span>
                            )}
                        </td>
                    </tr>
                );
            });
        };

        return (
            <div className="flex flex-col h-full">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-xs sm:text-sm">
                        <thead className="sticky top-0 bg-primary">
                            <tr className="text-textColor-primary border-b border-gray-700">
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('warehouse', 'warehouseName')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.warehouse.column === 'warehouseName' && sortConfig.warehouse.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Warehouse Name
                                        {getSortIcon('warehouse', 'warehouseName')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('warehouse', 'used')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.warehouse.column === 'used' && sortConfig.warehouse.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Used
                                        {getSortIcon('warehouse', 'used')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('warehouse', 'available')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.warehouse.column === 'available' && sortConfig.warehouse.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Available
                                        {getSortIcon('warehouse', 'available')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('warehouse', 'status')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.warehouse.column === 'status' && sortConfig.warehouse.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Status
                                        {getSortIcon('warehouse', 'status')}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderWarehouseRows()}
                        </tbody>
                    </table>
                </div>
                {!loading && remainingRows > 0 && (
                    <div className="flex justify-center py-2 pt-3">
                        <span className="text-textColor-tertiary text-xs">
                            +{remainingRows} more
                        </span>
                    </div>
                )}
            </div>
        );
    };

    // Low Stock Items Section
    const LowStockSection = () => {
        const lowStockData = getSortedData(data.lowstock || [], 'lowstock');
        const visibleRows = Math.min(8, lowStockData.length);
        const remainingRows = Math.max(0, lowStockData.length - visibleRows);
        
        const renderLowStockRows = () => {
            return Array.from({ length: 8 }, (_, index) => {
                const item = lowStockData[index];
                const isVisible = item && index < visibleRows;
                
                if (loading) {
                    return (
                        <tr key={index} className={index < 7 ? "border-b border-gray-800" : ""}>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-12"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-12"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-12"></div>
                            </td>
                            <td className="py-2 px-2">
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-20"></div>
                            </td>
                        </tr>
                    );
                }

                return (
                    <tr key={index} className={`${index < 7 ? "border-b border-gray-800" : ""} ${!isVisible ? "opacity-0" : ""}`}>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? item.itemCode : "XXX"}
                        </td>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? item.itemName : "Hidden Item"}
                        </td>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? item.current : "0"}
                        </td>
                        <td className="py-2 px-2 text-textColor-primary text-xs sm:text-sm">
                            {isVisible ? item.toOrder : "0"}
                        </td>
                        <td className="py-2 px-2">
                            {isVisible ? (
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColorClass(item.status)}`}>
                                    {item.status}
                                </span>
                            ) : (
                                <span className="text-gray-400 text-xs sm:text-sm">Hidden</span>
                            )}
                        </td>
                    </tr>
                );
            });
        };

        return (
            <div className="flex flex-col h-full">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-xs sm:text-sm">
                        <thead className="sticky top-0 bg-primary">
                            <tr className="text-textColor-primary border-b border-gray-700">
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('lowstock', 'itemCode')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.lowstock.column === 'itemCode' && sortConfig.lowstock.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Item Code
                                        {getSortIcon('lowstock', 'itemCode')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('lowstock', 'itemName')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.lowstock.column === 'itemName' && sortConfig.lowstock.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Item Name
                                        {getSortIcon('lowstock', 'itemName')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('lowstock', 'current')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.lowstock.column === 'current' && sortConfig.lowstock.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Current
                                        {getSortIcon('lowstock', 'current')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('lowstock', 'toOrder')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.lowstock.column === 'toOrder' && sortConfig.lowstock.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        To order
                                        {getSortIcon('lowstock', 'toOrder')}
                                    </button>
                                </th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">
                                    <button 
                                        onClick={() => handleSort('lowstock', 'status')}
                                        className={`flex items-center gap-1 hover:text-btn-primary transition-colors ${
                                            sortConfig.lowstock.column === 'status' && sortConfig.lowstock.direction !== null ? 'text-btn-primary' : ''
                                        }`}
                                    >
                                        Status
                                        {getSortIcon('lowstock', 'status')}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderLowStockRows()}
                        </tbody>
                    </table>
                </div>
                {!loading && remainingRows > 0 && (
                    <div className="flex justify-center py-2 pt-3">
                        <span className="text-textColor-tertiary text-xs">
                            +{remainingRows} more
                        </span>
                    </div>
                )}
            </div>
        );
    };

    if (error) {
        return (
            <div className="text-red-400 text-sm p-4">
                Error: {error}
            </div>
        );
    }

    // Return the appropriate section based on the section prop
    switch (section) {
        case 'inventory':
            return <InventorySection />;
        case 'warehouse':
            return <WarehouseSection />;
        case 'lowstock':
            return <LowStockSection />;
        default:
            return null;
    }
};

export default DashboardSummary;
