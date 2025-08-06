import React, { useEffect, useState } from 'react';

const QuickSummaryCard = () => {
  const [summary, setSummary] = useState({
    warehouses: 0,
    totalStocks: 0,
    shipments: 0,
    pendingShipments: 0,
  });

  const summaryIcons = ["🏭", "📦", "📥", "🔄"];

  useEffect(() => {
    const fetchData = async () => {
      const baseURL = import.meta.env.VITE_SITE || 'http://localhost:4321';

      try {
        const res = await fetch(`${baseURL}/api/tracking/quick-summary`);
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error('Error fetching quick summary data:', err);
      }
    };

    fetchData();
  }, []);

  const quickSummaryData = [
    { label: "Warehouses", value: summary.warehouses, color: "text-blue" },
    { label: "Total Stocks", value: summary.totalStocks.toLocaleString(), color: "text-yellow" },
    { label: "Shipments Received", value: summary.shipments, color: "text-green" },
    { label: "Pending Shipments", value: summary.pendingShipments, color: "text-red" }
  ];

  return (
    <div className="w-full grid grid-cols-5 grid-rows-1 gap-4 mb-4">
      <div className="bg-primary col-span-5 row-span-1 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-textColor-primary text-lg sm:text-xl lg:text-2xl font-semibold">Quick Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickSummaryData.map((item, index) => (
            <div key={index} className="bg-background rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">{summaryIcons[index]}</div>
              <div className={`text-xl font-bold ${item.color} mb-1`}>{item.value}</div>
              <div className="text-textColor-primary text-sm">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickSummaryCard;
