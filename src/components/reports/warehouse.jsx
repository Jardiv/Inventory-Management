import { useState, useEffect } from 'react';

const WarehouseTable = ({ currentPage = 1, itemsPerPage = 10 }) => {
    const [warehouseData, setWarehouseData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to get status styling
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Available':
                return 'text-green-400 bg-green-400/10';
            case 'Medium':
                return 'text-blue-400 bg-blue-400/10';
            case 'High':
                return 'text-yellow-400 bg-yellow-400/10';
            case 'Critical':
                return 'text-orange-400 bg-orange-400/10';
            case 'Full':
                return 'text-red-400 bg-red-400/10';
            default:
                return 'text-gray-400 bg-gray-400/10';
        }
    };

    // Fetch warehouse data
    const fetchWarehouseData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const apiUrl = `/api/reports/warehouse?limit=${itemsPerPage}&page=${currentPage}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            setWarehouseData(result.data || []);
            setTotalPages(result.pagination?.totalPages || 1);
            setTotalItems(result.pagination?.totalItems || 0);
            
        } catch (err) {
            console.error('Failed to fetch warehouse data:', err);
            setError(err.message);
            
            // Fallback to mock data for development
            setWarehouseData([
                { id: 1, name: 'Main Warehouse', used: 750, max: 1000, available: 250, utilization: 75, status: 'High', isVisible: true },
                { id: 2, name: 'Secondary Warehouse', used: 300, max: 800, available: 500, utilization: 38, status: 'Available', isVisible: true },
                { id: 3, name: 'Storage Unit A', used: 950, max: 1000, available: 50, utilization: 95, status: 'Critical', isVisible: true },
            ]);
            setTotalPages(1);
            setTotalItems(3);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouseData();
    }, [currentPage, itemsPerPage]);

    // Create exactly 10 rows (fill with empty invisible rows if needed)
    const tableRows = [];
    for (let i = 0; i < itemsPerPage; i++) {
        if (i < warehouseData.length) {
            tableRows.push(warehouseData[i]);
        } else {
            tableRows.push({
                id: null,
                name: '',
                used: 0,
                max: 0,
                available: 0,
                utilization: 0,
                status: '',
                isVisible: false
            });
        }
    }

    // Calculate pagination info
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + warehouseData.length, startIndex + itemsPerPage);

    if (loading) {
        return (
            <>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm table-fixed">
                            <thead className="sticky top-0 bg-primary">
                                <tr className="text-textColor-primary border-b border-gray-700">
                                    <th className="text-left py-3 px-4 font-medium w-[20%]">Warehouse</th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Used</th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Max</th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Available</th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Utilization</th>
                                    <th className="text-left py-3 px-4 font-medium w-[20%]">Status</th>
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
                                            <div className="animate-pulse bg-gray-700 h-4 w-24 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-16 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-16 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-16 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-4 w-12 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="animate-pulse bg-gray-700 h-6 w-20 rounded"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-700 flex-shrink-0">
                    <div className="px-4 py-2 rounded font-medium text-sm bg-gray-700 text-gray-500">
                        Previous
                    </div>
                    <span className="text-textColor-primary text-sm">
                        Loading...
                    </span>
                    <div className="px-4 py-2 rounded font-medium text-sm bg-gray-700 text-gray-500">
                        Next
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
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
                                <th className="text-left py-3 px-4 font-medium w-[20%]">Warehouse</th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Used</th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Max</th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Available</th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Utilization</th>
                                <th className="text-left py-3 px-4 font-medium w-[20%]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="min-h-[500px]">
                            {tableRows.map((warehouse, index) => (
                                <tr 
                                    key={warehouse.id || `empty-${index}`}
                                    className={`border-b border-gray-800 hover:bg-gray-800/30 h-[50px] ${warehouse.isVisible ? '' : 'invisible'} ${index === 9 ? 'border-b-0' : ''}`}
                                    style={{ height: '50px' }}
                                >
                                    <td className="py-4 px-4 text-textColor-primary font-medium">{warehouse.name}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{warehouse.isVisible ? warehouse.used.toLocaleString() : ''}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{warehouse.isVisible ? warehouse.max.toLocaleString() : ''}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{warehouse.isVisible ? warehouse.available.toLocaleString() : ''}</td>
                                    <td className="py-4 px-4 text-textColor-primary">{warehouse.isVisible ? `${warehouse.utilization}%` : ''}</td>
                                    <td className="py-4 px-4">
                                        {warehouse.isVisible && (
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusStyle(warehouse.status)}`}>
                                                {warehouse.status}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-700 flex-shrink-0">
                <a 
                    href={currentPage > 1 ? `?page=${currentPage - 1}` : '#'} 
                    className={`px-4 py-2 rounded font-medium text-sm ${
                        currentPage > 1 
                            ? 'bg-btn-primary hover:bg-gray-600 text-textColor-secondary' 
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    Previous
                </a>
                <span className="text-textColor-primary text-sm">
                    Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{endIndex} of {totalItems} warehouses
                </span>
                <a 
                    href={currentPage < totalPages ? `?page=${currentPage + 1}` : '#'} 
                    className={`px-4 py-2 rounded font-medium text-sm ${
                        currentPage < totalPages 
                            ? 'bg-btn-primary hover:bg-gray-600 text-textColor-secondary' 
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    Next
                </a>
            </div>
        </>
    );
};

export default WarehouseTable;
