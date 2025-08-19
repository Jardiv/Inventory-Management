import { useState, useEffect } from 'react';
import { useToast } from '../common/ToastProvider.jsx';
import { notifyLowQuantity, notifyOutOfStock, notifyActionFailed } from '../../utils/notifications.js';

const QuickSummary = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Make toast optional to avoid errors when not wrapped in ToastProvider
    let toast = null;
    try {
        toast = useToast();
    } catch (e) {
        // Component is not wrapped in ToastProvider, toast will be null
        console.warn('QuickSummary: ToastProvider not found, notifications disabled');
    }

    // Icons for Quick Summary
    const summaryIcons = ["📦", "📊", "⚠️", "❌", "🏭"];

    useEffect(() => {
        fetchQuickSummary();
    }, []);

    const fetchQuickSummary = async ( ) => {
        try {
            setLoading(true);
            const response = await fetch('/api/inventory/quick-summary');
            const result = await response.json();
            
            if (result.success) {
                setSummaryData(result.data);
                
                // Check for alerts based on summary data (only if toast is available)
                if (toast) {
                    result.data.forEach((item, index) => {
                        if (index === 2 && item.value > 0) { // Low Stock items
                            notifyLowQuantity(toast, `${item.value} products`, item.value, 10);
                        }
                        if (index === 3 && item.value > 0) { // Out of Stock items
                            notifyOutOfStock(toast, `${item.value} products are out of stock`);
                        }
                    });
                }
            } else {
                setError(result.error || 'Failed to fetch summary data');
                if (toast) {
                    notifyActionFailed(toast, 'fetch inventory summary', result.error);
                }
            }
        } catch (err) {
            setError('Network error occurred');
            if (toast) {
                notifyActionFailed(toast, 'connect to inventory system', 'Network connection failed');
            }
            console.error('Error fetching quick summary:', err);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="text-red-400 text-sm p-4">
                Error: {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="bg-background rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2 opacity-50">📊</div>
                        <div className="h-6 bg-gray-700 rounded mb-1 w-16 mx-auto"></div>
                        <div className="h-4 bg-gray-700 rounded w-20 mx-auto"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {summaryData.map((item, index) => (
                <div key={index} className="bg-background rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">{summaryIcons[index] || "📊"}</div>
                    <div className={`text-xl font-bold ${item.color} mb-1`}>{item.value}</div>
                    <div className="text-textColor-primary text-sm">{item.label}</div>
                </div>
            ))}
        </div>
    );
};

export default QuickSummary;
