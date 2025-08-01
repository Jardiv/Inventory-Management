import { useState, useEffect } from 'react';

const DashboardSummary = ({ section }) => {
    const [data, setData] = useState({
        inventory: [],
        warehouse: [],
        lowstock: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            case 'Almost Full':
            case 'Critical':
                return 'text-orange bg-orange/10'; // Uses CSS custom property --color-orange
            case 'High Usage':
            case 'High':
                return 'text-orange bg-orange/10'; // Uses CSS custom property --color-orange
            case 'Medium':
                return 'text-blue bg-blue/10'; // Uses CSS custom property --color-blue
            default:
                return 'text-textColor-tertiary bg-textColor-tertiary/10'; // Fallback to tertiary text color
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
        const inventoryData = data.inventory || [];
        const visibleRows = Math.min(8, Math.max(5, inventoryData.length));
        const remainingRows = Math.max(0, inventoryData.length - visibleRows);
        
        const renderInventoryRows = () => {
            return Array.from({ length: 8 }, (_, index) => {
                const item = inventoryData[index];
                const isVisible = item && index < Math.max(5, inventoryData.length);
                
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
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Item Name</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Current</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Minimum</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Status</th>
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
        const warehouseData = data.warehouse || [];
        const visibleRows = Math.min(8, Math.max(5, warehouseData.length));
        const remainingRows = Math.max(0, warehouseData.length - visibleRows);
        
        const renderWarehouseRows = () => {
            return Array.from({ length: 8 }, (_, index) => {
                const warehouse = warehouseData[index];
                const isVisible = warehouse && index < Math.max(5, warehouseData.length);
                
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
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Warehouse Name</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Used</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Available</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Status</th>
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
        const lowStockData = data.lowstock || [];
        const visibleRows = Math.min(8, Math.max(5, lowStockData.length));
        const remainingRows = Math.max(0, lowStockData.length - visibleRows);
        
        const renderLowStockRows = () => {
            return Array.from({ length: 8 }, (_, index) => {
                const item = lowStockData[index];
                const isVisible = item && index < Math.max(5, lowStockData.length);
                
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
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Item Code</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Item Name</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Current</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">To order</th>
                                <th className="text-left py-1 px-2 text-xs sm:text-sm">Status</th>
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
