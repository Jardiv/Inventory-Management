import React, { useEffect, useState } from 'react';

const LowQuantityStockCard = () => {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/lowstock?limit=5')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Always show only 5 items, even if API returns more
          setItems(data.data.slice(0, 5));
          setTotalItems(data.pagination?.totalItems || data.data.length);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-primary col-span-2 row-span-3 rounded-lg p-6 flex flex-col justify-between overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-textColor-primary text-xl font-bold">Low Quantity Items</h2>
        <a href="/reports/LowStock" className="text-btn-primary hover:text-purple-300 text-sm sm:text-base">See All</a>
      </div>
      <div className="flex flex-col h-full">
        <div className="overflow-auto flex-1 sticky">
          {loading ? (
            <div className="text-color-border_color">Loading...</div>
          ) : items.length > 0 ? (
            <>
              {items.map((item) => (
                <div className="mb-3" key={item.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-textColor-primary font-semibold">{item.name}</span>
                      <span className="block text-textColor-tertiary text-sm">Remaining Quantity: {item.quantity} {item.unit || 'Packet'}</span>
                    </div>
                    <span className={
                      item.status === 'Low' ? 'status-low font-bold' :
                      item.status === 'Out of stock' ? 'status-out font-bold' :
                      'status-normal font-bold'
                    }>
                      {item.status === 'Low' ? 'Low' : item.status === 'Out of stock' ? 'N/A' : ''}
                    </span>
                  </div>
                </div>
              ))}
              {totalItems > 5 && (
                <div className="text-color-border_color text-sm mt-2 w-full flex justify-center">+{totalItems - 5} more items</div>
              )}
            </>
          ) : (
            <div className="text-color-border_color">No low stock items found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowQuantityStockCard;