import React, { useEffect, useState } from 'react';

export default function WarehouseOverview() {
  const [warehouse, setWarehouse] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [warehouseId, setWarehouseId] = useState('1');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const idFromURL = searchParams.get('warehouse_id');
    setWarehouseId(idFromURL || '1'); // fallback to '1' if not provided
  }, []);

  useEffect(() => {
    if (!warehouseId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/tracking/warehouse-overview?warehouse_id=${warehouseId}`);
        const data = await res.json();
        setWarehouse(data.warehouse);
        setItems(data.items);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [warehouseId]);

  if (loading) return <div>Loading...</div>;
  if (!warehouse) return <div>Error loading warehouse data.</div>;

  // Calculate capacity usage (assuming it's the sum of all item quantities)
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const capacityUsage = Math.round((totalQty / warehouse.max_capacity) * 100);

  return (
    <div className="bg-primary px-6 py-4 rounded-lg h-full overflow-auto font-[Poppins] text-textColor-primary">
      {/* Header */}
      <div className="flex justify-between h-header mb-6">
        <div>
          <h1 className="font-semibold text-2xl">{warehouse.name} Overview</h1>
          <p className="text-border_color">Detailed overview of the Warehouse.</p>
        </div>

        {/* back button to warehouse-storage */}
        <a
        href={`/tracking/warehouse-storage/?warehouse_id=${warehouseId}`}
        className="p-2 h-fit text-textColor-primary hover:bg-btn-hover hover:text-white rounded"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </a>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-5 gap-4 h-[80%]">
        {/* Left Column: Warehouse Details */}
        <div className="col-span-3 py-4">
          <h2 className="text-lg font-semibold mb-2">{warehouse.name} Details</h2>
          <div className="bg-background border-[0.5px] border-border_color px-4 py-2 overflow-x-auto h-full flex flex-col justify-between">
            <table className="w-full text-left table-fixed mb-4">
              <thead>
                <tr className="border-b-[0.5px]">
                  <th className="w-[33%]">Item</th>
                  <th>Quantity</th>
                  <th>Assigned Date</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="bg-background">{item.items.name}</td>
                    <td className="bg-background">{item.quantity}</td>
                    <td className="bg-background">
                      {new Date(item.date_assigned).toLocaleDateString()}
                    </td>
                    <td className="bg-background">{item.items.category.name}</td>
                    <td className="bg-background">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="ml-auto text-right">
              <tbody>
                <tr>
                  <td className="text-right px-4 py-2 font-semibold">Capacity</td>
                  <td>
                    {totalQty}/{warehouse.max_capacity}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Primary Details */}
        <div className="gap-12 px-8 col-span-2 flex flex-col">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Primary Details</h2>
            <hr className="mb-4" />
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="font-semibold">Warehouse name</td>
                  <td>{warehouse.name}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Location</td>
                  <td>{warehouse.location}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Total Capacity</td>
                  <td className="text-green">{warehouse.max_capacity}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Capacity Utilization</td>
                  <td>{capacityUsage}% full</td>
                </tr>
                <tr>
                  <td className="font-semibold">Created By</td>
                  <td>System Admin</td> {/* Hardcoded unless you have this in DB */}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
