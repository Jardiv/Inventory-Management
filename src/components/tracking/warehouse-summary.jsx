import { useEffect, useState } from 'react';

export default function WarehouseSummary() {
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch list of warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/tracking/warehouses');
        const result = await res.json();
        if (result.data?.length) {
          setWarehouseList(result.data);
          setSelectedWarehouse(result.data[0].id); // Default to first
        }
      } catch (err) {
        console.error("Error fetching warehouses", err);
      }
    };

    fetchWarehouses();
  }, []);

  // Fetch items for selected warehouse
  useEffect(() => {
    if (!selectedWarehouse) return;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tracking/warehouse-storage?page=1&limit=5&warehouse_id=${selectedWarehouse}`);
        const result = await res.json();
        setWarehouseItems(result.data || []);
      } catch (err) {
        console.error("Error fetching warehouse items", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedWarehouse]);

  return (
    <div className="w-full bg-primary rounded-lg p-6 mb-4 text-textColor-primary font-[Poppins]">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Warehouse Summary</h2>

          {/* Dropdown */}
          <div className="relative">
            <div className="relative inline-block text-left">
              <button
                onClick={() => document.getElementById('dropdown')?.classList.toggle('hidden')}
                className="flex justify-between items-center bg-primary text-textColor-primary rounded px-4 py-2 text-sm w-auto min-w-[160px] whitespace-nowrap border border-transparent hover:border-btn-hover"
              >
                <span>
                  {warehouseList.find(w => w.id === selectedWarehouse)?.name || "Select Warehouse"}
                </span>
                <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown menu */}
              <div
                id="dropdown"
                className="hidden absolute mt-2 bg-primary border border-border_color rounded shadow-md z-10 w-[160px] max-h-60 overflow-y-auto"
              >
                <ul className="py-1 text-sm text-textColor-primary">
                  {warehouseList.map(w => (
                    <li key={w.id}>
                      <button
                        onClick={() => {
                          setSelectedWarehouse(w.id);
                          document.getElementById('dropdown')?.classList.add('hidden');
                        }}
                        className="block px-4 py-2 w-full text-left hover:bg-btn-hover hover:text-textColor-secondary"
                      >
                        {w.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <a 
        href={`/tracking/warehouse-storage?warehouse_id=${selectedWarehouse}&page=1`} 
        className="text-btn-primary text-sm hover:underline"
        >
        See All
        </a>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-4 text-sm font-semibold border-b border-border_color py-3">
        <div className="text-center">Item ID</div>
        <div className="text-center">Name</div>
        <div className="text-center">Quantity</div>
        <div className="text-center">Category</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border_color">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="grid grid-cols-4 py-4 text-center text-sm">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-center">
                  <div className="h-5 w-20 bg-gray-300 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <>
            {warehouseItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 py-4 text-center text-sm">
                <div>{item.items?.sku || '-'}</div>
                <div>{item.items?.name || '-'}</div>
                <div>{item.quantity}</div>
                <div className="font-semibold">{item.items?.category?.name || '-'}</div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 5 - warehouseItems.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="grid grid-cols-4 py-4 text-center text-sm text-transparent">
                <div>-</div><div>-</div><div>-</div><div>-</div>
              </div>
            ))}
          </>
        )}
      </div>

    </div>
  );
}
