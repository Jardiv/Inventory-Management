import React, { useState, useEffect } from 'react';

const Summary = () => {
    const [summaryData, setSummaryData] = useState({
        stockIn: 0,
        stockOut: 0,
        itemsReceived: 0,
        itemsSent: 0,
        pendingTransactions: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummaryData = async () => {
            try {
                const response = await fetch('/api/transactions/summary');
                const result = await response.json();

                if (result.success) {
                    setSummaryData(result.data);
                } else {
                    setError(result.error || 'Failed to fetch summary data.');
                }
            } catch (err) {
                setError('Failed to connect to the server.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummaryData();
    }, []);

    const StatCard = ({ title, value, icon }) => (
        <div className="bg-primary p-4 rounded-lg flex items-center">
            <div className="mr-4">
                {icon}
            </div>
            <div>
                <h3 className="text-gray-400 text-sm font-semibold">{title}</h3>
                <p className="text-2xl text-white font-bold">{value}</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-primary p-4 rounded-lg animate-pulse flex">
                        <div className="h-8 w-8 bg-textColor-tertiary rounded-full mb-2"></div>
                        <div className="ml-4 h-4 w-full">
                            <div className="h-4 w-3/4 bg-textColor-tertiary rounded"></div>
                            <div className="h-6 w-1/2 bg-textColor-tertiary rounded mt-2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center bg-primary p-4 rounded-lg">Summary data not available</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard 
                title="Stock In (This Month)" 
                value={summaryData.stockIn}
                icon={<svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>}
            />
            <StatCard 
                title="Stock Out (This Month)" 
                value={summaryData.stockOut}
                icon={<svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path></svg>}
            />
            <StatCard 
                title="Items Received"
                value={summaryData.itemsReceived}
                icon={<svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            />
            <StatCard 
                title="Items Sent" 
                value={summaryData.itemsSent}
                icon={<svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            />
            <StatCard 
                title="Pending Transactions" 
                value={summaryData.pendingTransactions}
                icon={<svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
            />
        </div>
    );
};

export default Summary;