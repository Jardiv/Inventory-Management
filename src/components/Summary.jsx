import { useState, useEffect } from 'react';

const DashboardSummary = ({ section }) => {
    const [data, setData] = useState({
        inventory: [],
        warehouse: [],
        lowstock: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                            <span className={`${isVisible ? item.statusColor : "text-gray-400"} text-xs sm:text-sm`}>
                                {isVisible ? item.status : "Hidden"}
                            </span>
                        </td>
                    </tr>
                );
            });
        };

        return (
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
        );
    };

    // Warehouse Capacity Section
    const WarehouseSection = () => {
        const warehouseData = data.warehouse || [];
        
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
                            <span className={`${isVisible ? warehouse.statusColor : "text-gray-400"} text-xs sm:text-sm`}>
                                {isVisible ? warehouse.status : "Hidden"}
                            </span>
                        </td>
                    </tr>
                );
            });
        };

        return (
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
        );
    };

    // Low Stock Items Section
    const LowStockSection = () => {
        const lowStockData = data.lowstock || [];
        
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
                            <span className={`${isVisible ? item.statusColor : "text-gray-400"} text-xs sm:text-sm`}>
                                {isVisible ? item.status : "Hidden"}
                            </span>
                        </td>
                    </tr>
                );
            });
        };

        return (
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
