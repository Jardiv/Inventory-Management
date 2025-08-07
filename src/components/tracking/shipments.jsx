import React, { useEffect, useState } from 'react';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); 
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouseCapacity, setWarehouseCapacity] = useState({ current: 0, max: 0 });
  const [selectedProducts, setSelectedProducts] = useState(
    Array(5).fill('') // Assuming 5 products initially
  );
  const [assignedProducts, setAssignedProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]); 
  const [shipmentProducts, setShipmentProducts] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch('/api/tracking/shipments');
        const data = await res.json();

        if (res.ok) {
          // Sort so that Pending shipments appear at the top
          const sortedShipments = data.sort((a, b) => {
            if (a.status === 'Pending' && b.status !== 'Pending') return -1;
            if (a.status !== 'Pending' && b.status === 'Pending') return 1;
            return 0; // maintain original order otherwise
          });

          setShipments(sortedShipments);

          // Extract unique products
          // Keep name and quantity of each product from shipments
          const uniqueProductsMap = new Map();
          data.forEach(item => {
            if (item.status !== 'Delivered' && !uniqueProductsMap.has(item.name)) {
              uniqueProductsMap.set(item.name, {
                name: item.name,
                quantity: item.qty,
                item_id: item.item_id
              });
            }
          });
          setShipmentProducts(Array.from(uniqueProductsMap.values()));
        } else {
          console.error('Error fetching shipments:', data.error);
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/tracking/warehouses');
        const data = await res.json();

        console.log('Fetched warehouse data:', data);

        if (res.ok && Array.isArray(data.data)) {
          setWarehouses(data.data); // ✅ Correct!
        } else {
          console.error('Error fetching warehouses:', data.error || 'Invalid response format');
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      }
    };

    fetchShipments();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const fetchWarehouseCapacity = async () => {
      if (!selectedWarehouse) return;

      try {
        const res = await fetch(`/api/tracking/warehouse-capacity?warehouse_id=${selectedWarehouse}`);
        const data = await res.json();

        if (res.ok) {
          setWarehouseCapacity({ current: data.current_quantity, max: data.max_capacity });
        } else {
          console.error('Failed to fetch capacity:', data.error);
        }
      } catch (err) {
        console.error('Error fetching warehouse capacity:', err);
      }
    };

    fetchWarehouseCapacity();
  }, [selectedWarehouse, showModal]);

  const handleAssignItems = async () => {
    if (!selectedWarehouse) {
      alert('Please select a warehouse first');
      return;
    }

    if (assignedProducts.length === 0) {
      alert('Please add at least one product to assign');
      return;
    }

    setIsAssigning(true);

    try {
      console.log('Sending assignment request:', {
        warehouseId: selectedWarehouse,
        items: assignedProducts.map(product => ({
          name: product.name,
          quantity: product.quantity
        }))
      });

      const response = await fetch('/api/tracking/assign-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          items: assignedProducts.map(product => ({
            name: product.name,
            quantity: product.quantity
          }))
        })
      });

      const data = await response.json();
      console.log('Assignment response:', data);

      if (response.ok) {
        alert(`Successfully assigned ${assignedProducts.length} items to warehouse!`);
        
        // Reset modal state
        setAssignedProducts([]);
        setSelectedWarehouse('');
        setSelectedProducts(Array(5).fill(''));
        setWarehouseCapacity({ current: 0, max: 0 });
        setShowModal(false);

        // Refresh shipments data to show updated status
        const res = await fetch('/api/tracking/shipments');
        const shipmentsData = await res.json();
        if (res.ok) {
          setShipments(shipmentsData);
        }

        // Show success message with details if available
        if (data.errors && data.errors.length > 0) {
          console.warn('Some items had warnings:', data.errors);
        }
        
      } else {
        console.error('Assignment failed:', data);
        alert(`Failed to assign items: ${data.error || 'Unknown error'}`);
        
        if (data.details) {
          console.error('Details:', data.details);
        }
      }
    } catch (error) {
      console.error('Error assigning items:', error);
      alert('Failed to assign items. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const emptyRows = 11 - shipments.length;
  return (
    <div className="w-full max-w-[100%] bg-primary rounded-md mx-auto p-6 text-textColor-primary font-poppins">
      {/* Title & Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Incoming Shipments</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-transparent rounded hover:border-btn-hover hover:text-textColor-secondary transition"
          >
            <span>Assign Items</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
              <path fillRule="evenodd" d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087ZM12 10.5a.75.75 0 0 1 .75.75v4.94l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72v-4.94a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Filter & Cancel */}
          <div className="flex items-center gap-2 relative">
            <div className="relative inline-block text-center">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-primary text-secondary rounded px-4 py-3 text-sm hover:text-textColor-secondary hover:bg-violet-600 w-[60px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="9" y1="18" x2="15" y2="18" />
                </svg>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-primary border border-border_color rounded shadow-md z-10 w-[130px]">
                  <ul className="py-1 text-sm text-textColor-primary text-left">
                    <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Received</a></li>
                    <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Delivered</a></li>
                    <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Pending</a></li>
                  </ul>
                </div>
              )}
            </div>

            <a href="/tracking/Dashboard">
              <button className="bg-primary text-secondary rounded px-4 py-3 text-sm hover:text-textColor-secondary hover:bg-violet-600 w-[60px]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-4 text-center text-lg border-b border-border_color py-2 font-medium">
            <div className="min-w-[150px]">Shipment ID</div>
            <div className="min-w-[150px]">Item name</div>
            <div className="min-w-[200px]">Quantity</div>
            <div className="min-w-[150px]">Status</div>
          </div>
          <div className="divide-y divide-border_color">
            {shipments.map((t, i) => (
              <div key={i} className="grid grid-cols-4 text-center text-lg py-4 font-normal">
                <div>{t.id}</div>
                <div>{t.name}</div>
                <div>{t.qty}</div>
                <div>{t.status}</div>
              </div>
            ))}
            {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 text-center text-lg h-[56px] font-normal opacity-50">
                <div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center border-t border-border_color pt-4 mt-4 text-sm text-gray-700">
        <div>Showing <span className="font-medium">1</span>-<span className="font-medium">10</span> of <span className="font-medium">45</span> products</div>
        <nav className="flex items-center gap-1">
          <a href="?page=1" className="px-2 py-1 text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <a href="?page=1" className="px-3 py-1.5 bg-[#8A00C4] text-white rounded-lg font-medium">1</a>
          <a href="?page=2" className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg">2</a>
          <span className="px-2 py-1 text-gray-500">...</span>
          <a href="?page=5" className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg">5</a>
          <a href="?page=2" className="px-2 py-1 text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </nav>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-[#121212] border border-[#676767] shadow-[0_4px_4px_797px_rgba(0,0,0,0.49)] rounded-lg w-[711px] h-[854px] text-white font-poppins overflow-hidden">
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)} 
              disabled={isAssigning}
              className="absolute top-4 right-4 w-[34px] h-[34px] flex items-center justify-center disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mx-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <h2 className="absolute top-5 left-7 text-2xl font-semibold">Assign Items</h2>

            {/* Warehouse Section */}
            <div className="absolute top-[95px] left-10 text-white text-xl">Warehouse</div>
            <div className="absolute top-[133px] left-[39px] w-[636px] h-[65px]">
              <div className="relative w-full h-full">
                <select
                  value={selectedWarehouse}
                  onChange={async (e) => {
                    const warehouseId = e.target.value;
                    setSelectedWarehouse(warehouseId);

                    try {
                      const res = await fetch(`/api/tracking/warehouse-capacity?warehouse_id=${warehouseId}`);
                      const data = await res.json();

                      if (res.ok) {
                        setWarehouseCapacity({ current: data.current_quantity, max: data.max_capacity });
                      } else {
                        console.error('Failed to fetch capacity:', data.error);
                      }
                    } catch (err) {
                      console.error('Error fetching warehouse capacity:', err);
                    }
                  }}
                  disabled={isAssigning}
                  className="w-full h-full bg-[#121212] border border-white rounded-md text-white text-lg px-4 appearance-none disabled:opacity-50"
                >
                  <option value="" disabled>Select a warehouse</option>
                  {warehouses?.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
                {/* Down Arrow Icon */}
                <div className="pointer-events-none absolute top-1/2 right-4 transform -translate-y-1/2 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg"fill="none"viewBox="0 0 24 24"strokeWidth="1.5"stroke="currentColor"className="w-4 h-4">
                    <path strokeLinecap="round"strokeLinejoin="round"d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>
            </div>
            {/* Product Section */}
            <div className="absolute top-[223px] left-10 text-white text-xl">Product</div>
            <div className="absolute top-[267px] left-[39px] w-[513px] h-[65px]">
              <div className="relative w-full h-full">
                <select
                  value={selectedProducts[0]}
                  onChange={(e) => {
                    const updated = [...selectedProducts];
                    updated[0] = e.target.value;
                    setSelectedProducts(updated);
                  }}
                  disabled={isAssigning}
                  className="w-full h-full bg-[#121212] border border-white rounded-md text-white text-lg px-4 appearance-none disabled:opacity-50"
                >
                  <option value="" disabled>Select a product</option>
                  {shipmentProducts.map((product, idx) => (
                    <option key={idx} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>

                {/* Down arrow icon */}
                <div className="pointer-events-none absolute top-1/2 right-4 transform -translate-y-1/2 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Add Button */}
            <button
              onClick={() => {
                const selectedName = selectedProducts[0];
                const productDetails = shipmentProducts.find(p => p.name === selectedName);

                if (productDetails) {
                  setAssignedProducts((prev) => [
                    ...prev,
                    {
                      name: productDetails.name,
                      quantity: productDetails.quantity, // ✅ use the real quantity
                      item_id: productDetails.item_id    // optional for DB logic later
                    }
                  ]);

                  const updated = [...selectedProducts];
                  updated[0] = '';
                  setSelectedProducts(updated);
                }
              }}
              disabled={isAssigning}
              className="absolute top-[279px] right-[25px] w-[116px] h-[42px] bg-[#029F37] rounded-md text-white text-[17px] font-medium disabled:opacity-50"
            >
              Add
            </button>

            {/* Products Table */}
            <div className="absolute top-[378px] left-[41px] w-[644px] h-[335px] border border-white rounded-md overflow-y-auto px-4 pt-6">
              {/* Table Header */}
              <div className="grid grid-cols-3 text-xl mb-4 px-2">
                <div className="text-left">Product</div>
                <div className="text-center">Quantity</div>
                <div className="text-right">Action</div>
              </div>
              <hr className="border-white opacity-50" />

              {/* Sample Product Rows */}
              {assignedProducts.map((product, idx) => (
                <div key={idx}>
                  <div className="grid grid-cols-3 items-center my-4 px-2">
                    <div className="text-lg text-left">{product.name}</div>
                    <div className="text-lg text-center">{product.quantity}</div>
                    <div className="flex justify-end">
                      <button
                        className="text-red-500 hover:text-red-700 transition disabled:opacity-50"
                        disabled={isAssigning}
                        onClick={() =>
                          setAssignedProducts((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <hr className="border-white opacity-50" />
                </div>
              ))}
            </div>

            {/* Zone Capacity (now outside the scrollable product list) */}
            <div className="absolute top-[723px] right-[39px] text-white text-lg text-right">
              Warehouse Capacity: {warehouseCapacity.current}/{warehouseCapacity.max}
            </div>

            {/* Modal Footer Buttons */}
            <div className="absolute bottom-[32px] right-[32px] flex gap-4">
              <button 
                onClick={() => setShowModal(false)} 
                disabled={isAssigning}
                className="bg-[#FF2C2C] w-[153px] h-[42px] rounded-md text-white text-[17px] font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignItems}
                disabled={isAssigning || !selectedWarehouse || assignedProducts.length === 0}
                className="bg-[#029F37] w-[153px] h-[42px] rounded-md text-white text-[17px] font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isAssigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipments;