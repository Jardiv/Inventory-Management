import { useState, useEffect } from 'react';

const InventoryTable = ({ currentPage = 1, itemsPerPage = 10 }) => {
    const [inventoryData, setInventoryData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Fetch inventory data
    const fetchInventoryData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const apiUrl = `/api/reports/items?limit=${itemsPerPage}&page=${currentPage}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            setInventoryData(result.data || []);
            setTotalPages(result.pagination?.totalPages || 1);
            setTotalItems(result.pagination?.totalItems || 0);
            
        } catch (err) {
            console.error('Failed to fetch inventory data:', err);
            setError(err.message);
            
            // Fallback to mock data for development
            setInventoryData([
                { id: 1, code: 'PRD001', name: 'Product 1', current: 50, min: 20, max: 100, status: 'OK', isVisible: true },
                { id: 2, code: 'PRD002', name: 'Product 2', current: 15, min: 20, max: 100, status: 'LOW', isVisible: true },
                { id: 3, code: 'PRD003', name: 'Product 3', current: 0, min: 10, max: 200, status: 'OUT OF STOCK', isVisible: true },
            ]);
            setTotalPages(1);
            setTotalItems(3);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryData();
    }, [currentPage, itemsPerPage]);

    // Create exactly 10 rows (fill with empty invisible rows if needed)
    const tableRows = [];
    for (let i = 0; i < itemsPerPage; i++) {
        if (i < inventoryData.length) {
            tableRows.push(inventoryData[i]);
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
    const endIndex = Math.min(startIndex + inventoryData.length, startIndex + itemsPerPage);

    if (loading) {
        return (
            <>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm table-fixed">
                            <thead className="sticky top-0 bg-primary">
                                <tr className="text-textColor-primary border-b border-gray-700">
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Item Code</th>
                                    <th className="text-left py-3 px-4 font-medium w-[25%]">Item Name</th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Current</th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Min</th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Max</th>
                                    <th className="text-left py-3 px-4 font-medium w-[15%]">Status</th>
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
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Item Code</th>
                                <th className="text-left py-3 px-4 font-medium w-[25%]">Item Name</th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Current</th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Min</th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Max</th>
                                <th className="text-left py-3 px-4 font-medium w-[15%]">Status</th>
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
        </div>
    );
};

export default InventoryTable;
