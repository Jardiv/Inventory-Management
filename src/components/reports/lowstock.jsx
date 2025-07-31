import { useState, useEffect } from 'react';

const LowStockTable = ({ currentPage = 1 }) => {
    const [lowStockData, setLowStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to get status styling
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Low':
                return 'text-yellow-400';
            case 'Out of stock':
                return 'text-red-400';
            default:
                return 'text-gray-400';
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
                                    <input type="checkbox" id="selectAllHeader" className="rounded bg-gray-700 border-gray-600 pointer-events-none" disabled />
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
                                <tr key={item.id} className={`border-b border-gray-800 hover:bg-gray-800/30 ${index === 9 ? 'border-b-0' : ''}`}>
                                    <td className="py-4 px-4">
                                        <input type="checkbox" className="item-checkbox rounded bg-gray-700 border-gray-600" />
                                    </td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.sku}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.name}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.quantity}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.minimum}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{item.toOrder}</td>
                                    <td className="py-4 px-4">
                                        <span className={`font-semibold ${getStatusStyle(item.status)}`}>
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
