import React, { useEffect, useState } from 'react';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouseCapacity, setWarehouseCapacity] = useState({ current: 0, max: 0 });
  const [selectedProducts, setSelectedProducts] = useState(
    Array(5).fill('') // Assuming 5 products initially
  );
  const [assignedProducts, setAssignedProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]); 
  const [shipmentProducts, setShipmentProducts] = useState([]);
  const [availableShipments, setAvailableShipments] = useState([]); // New: detailed shipment data
  const [selectedShipmentDetails, setSelectedShipmentDetails] = useState([]); // New: selected specific shipments
  const [isAssigning, setIsAssigning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterStatus, setFilterStatus] = useState('All');

  // New shipment form state - modified to use item_id input
  const [newShipment, setNewShipment] = useState({
    item_id: '',
    quantity: '',
    note: ''
  }); 
  const [isAddingShipment, setIsAddingShipment] = useState(false);
  const [itemPreview, setItemPreview] = useState(null); // To show item details when valid ID is entered
  const [validationTimeout, setValidationTimeout] = useState(null); // For debouncing validation

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

          // NEW: Extract detailed shipment information for pending items
          const pendingShipments = data.filter(item => item.status === 'Pending');
          setAvailableShipments(pendingShipments);

          // Extract unique product names (for the dropdown)
          const uniqueProductNames = [...new Set(pendingShipments.map(item => item.name))];
          setShipmentProducts(uniqueProductNames.map(name => ({ name })));
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

  // Debounced validation function
  const debouncedValidateItemId = (itemId) => {
    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      validateItemId(itemId);
    }, 500); // Wait 500ms after user stops typing
    
    setValidationTimeout(timeout);
  };

  // FIXED: New function to validate and preview item details
  const validateItemId = async (itemId) => {
    if (!itemId || itemId.trim() === '' || isNaN(itemId)) {
      setItemPreview(null);
      return;
    }

    try {
      // FIXED: Try multiple possible API endpoints
      let res, data;
      
      // First try the standard items endpoint
      res = await fetch(`/api/tracking/items`);
      
      // If that fails, try alternative endpoints
      if (!res.ok) {
        console.log('Trying alternative endpoint...');
        res = await fetch(`/api/items`);
      }
      
      // If still failing, try direct database query endpoint
      if (!res.ok) {
        console.log('Trying direct query endpoint...');
        res = await fetch(`/api/tracking/validate-item?id=${itemId}`);
      }

      // Check if the response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON, likely received HTML error page');
        setItemPreview({ error: 'API endpoint not found' });
        return;
      }

      data = await res.json();
      
      console.log('Items API response:', data); // Debug log
      console.log('Looking for item ID:', parseInt(itemId)); // Debug log
      
      if (res.ok && Array.isArray(data)) {
        const item = data.find(item => {
          console.log('Checking item:', item.id, 'against', parseInt(itemId)); // Debug log
          return item.id === parseInt(itemId);
        });
        
        if (item) {
          console.log('Found item:', item); // Debug log
          setItemPreview(item);
        } else {
          console.log('Item not found in data'); // Debug log
          setItemPreview({ error: 'Item not found' });
        }
      } else if (res.ok && data.id) {
        // Single item response
        setItemPreview(data);
      } else {
        console.log('API response not ok or not array:', res.ok, Array.isArray(data)); // Debug log
        setItemPreview({ error: data.error || 'Error loading items' });
      }
    } catch (err) {
      console.error('Error validating item:', err);
      setItemPreview({ error: 'Error validating item - check console for details' });
    }
  };

  // NEW: Get available shipments for a specific product name
  const getShipmentsForProduct = (productName) => {
    return availableShipments.filter(shipment => 
      shipment.name === productName && 
      !selectedShipmentDetails.some(selected => selected.id === shipment.id)
    );
  };

  // NEW: Add specific shipment to selection
  const addShipmentToSelection = (shipment) => {
    setSelectedShipmentDetails(prev => [...prev, {
      id: shipment.id,
      name: shipment.name,
      quantity: shipment.qty,
      item_id: shipment.item_id || null
    }]);
  };

  // NEW: Remove specific shipment from selection
  const removeShipmentFromSelection = (shipmentId) => {
    setSelectedShipmentDetails(prev => prev.filter(item => item.id !== shipmentId));
  };

  const handleAssignItems = async () => {
    if (!selectedWarehouse) {
      alert('Please select a warehouse first');
      return;
    }

    if (selectedShipmentDetails.length === 0) {
      alert('Please add at least one shipment to assign');
      return;
    }

    // NEW: Calculate total quantity to be assigned
    const totalQuantityToAssign = selectedShipmentDetails.reduce((sum, shipment) => sum + shipment.quantity, 0);
    
    // NEW: Check if warehouse has enough capacity
    const availableCapacity = warehouseCapacity.max - warehouseCapacity.current;
    
    if (totalQuantityToAssign > availableCapacity) {
      alert(`Cannot assign items. Warehouse capacity exceeded!\n\nTrying to assign: ${totalQuantityToAssign} items\nAvailable capacity: ${availableCapacity} items\n\nCurrent: ${warehouseCapacity.current}/${warehouseCapacity.max}`);
      return;
    }

    // NEW: Warn if assignment will fill warehouse to near capacity (e.g., 90% or more)
    const newTotal = warehouseCapacity.current + totalQuantityToAssign;
    const capacityPercentage = (newTotal / warehouseCapacity.max) * 100;
    
    if (capacityPercentage >= 90) {
      const confirmed = confirm(`Warning: This assignment will fill the warehouse to ${capacityPercentage.toFixed(1)}% capacity (${newTotal}/${warehouseCapacity.max}).\n\nDo you want to continue?`);
      if (!confirmed) {
        return;
      }
    }

    setIsAssigning(true);

    try {
      console.log('Sending assignment request:', {
        warehouseId: selectedWarehouse,
        shipments: selectedShipmentDetails.map(shipment => ({
          shipmentId: shipment.id,
          name: shipment.name,
          quantity: shipment.quantity
        }))
      });

      const response = await fetch('/api/tracking/assign-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          items: selectedShipmentDetails.map(shipment => ({
            name: shipment.name,
            quantity: shipment.quantity,
            shipmentId: shipment.id // NEW: Include shipment ID for more precise tracking
          }))
        })
      });

      const data = await response.json();
      console.log('Assignment response:', data);

      if (response.ok) {
        alert(`Successfully assigned ${selectedShipmentDetails.length} shipments to warehouse!`);
        
        // Reset modal state
        setSelectedShipmentDetails([]);
        setSelectedWarehouse('');
        setSelectedProducts(Array(5).fill(''));
        setWarehouseCapacity({ current: 0, max: 0 });
        setShowModal(false);

        // Refresh shipments data to show updated status
        const res = await fetch('/api/tracking/shipments');
        const shipmentsData = await res.json();
        if (res.ok) {
          const sortedShipments = shipmentsData.sort((a, b) => {
            if (a.status === 'Pending' && b.status !== 'Pending') return -1;
            if (a.status !== 'Pending' && b.status === 'Pending') return 1;
            return 0;
          });
          setShipments(sortedShipments);
          
          // Update available shipments
          const pendingShipments = shipmentsData.filter(item => item.status === 'Pending');
          setAvailableShipments(pendingShipments);
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

  // FIXED: Better error handling and validation
  // CORRECTED: Updated handleAddShipment function to match shipments table schema
  const handleAddShipment = async () => {
    if (!newShipment.item_id || !newShipment.quantity) {
      alert('Please fill in all required fields (Item ID and Quantity)');
      return;
    }

    if (parseInt(newShipment.quantity) <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (itemPreview?.error) {
      alert('Please enter a valid Item ID');
      return;
    }

    setIsAddingShipment(true);

    try {
      console.log('Sending add shipment request:', {
        item_id: parseInt(newShipment.item_id),
        quantity: parseInt(newShipment.quantity),
        note: newShipment.note || null
      });

      const response = await fetch('/api/tracking/add-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: parseInt(newShipment.item_id),
          quantity: parseInt(newShipment.quantity),
          note: newShipment.note || null
        })
      });

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON, likely received HTML error page');
        alert('API endpoint not found. Please check your server configuration.');
        return;
      }

      const data = await response.json();
      console.log('Add shipment response:', data);

      if (response.ok) {
        alert('Shipment added successfully!');
        
        // Reset form
        setNewShipment({
          item_id: '',
          quantity: '',
          note: ''
        });
        setItemPreview(null);
        setShowAddModal(false);

        // Refresh shipments data
        const res = await fetch('/api/tracking/shipments');
        const shipmentsData = await res.json();
        if (res.ok) {
          // Sort so that Pending shipments appear at the top
          const sortedShipments = shipmentsData.sort((a, b) => {
            if (a.status === 'Pending' && b.status !== 'Pending') return -1;
            if (a.status !== 'Pending' && b.status === 'Pending') return 1;
            return 0;
          });
          setShipments(sortedShipments);
        }
        
      } else {
        console.error('Add shipment failed:', data);
        alert(`Failed to add shipment: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding shipment:', error);
      alert('Failed to add shipment. Please check the console for details.');
    } finally {
      setIsAddingShipment(false);
    }
  };

  const filteredShipments = filterStatus === 'All'
    ? shipments
    : shipments.filter(shipment => shipment.status === filterStatus);

  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const emptyRows = itemsPerPage - paginatedShipments.length;

  return (
    <div className="w-full max-w-[100%] bg-primary rounded-md mx-auto p-6 text-textColor-primary font-sans">
      {/* Title & Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Incoming Shipments</h2>
        <div className="flex gap-4">
          {/* Add Shipment Button */}
          {/* <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-transparent rounded hover:border-btn-hover transition"
          >
            <span>Add Shipment</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            </svg>
          </button> */}

          {/* Assign Items Button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-transparent rounded hover:border-btn-hover transition"
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
                className="bg-primary text-textColor-primary rounded px-4 py-3 text-sm hover:text-textColor-secondary hover:bg-btn-hover w-[60px]"
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
                    <li>
                      <button
                        onClick={() => {
                          setFilterStatus('Pending');
                          setShowDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-tbl-hover"
                      >
                        Pending
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setFilterStatus('Delivered');
                          setShowDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-tbl-hover"
                      >
                        Delivered
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setFilterStatus('All');
                          setShowDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-tbl-hover"
                      >
                        All
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <a href="/tracking/Dashboard">
              <button className="bg-primary text-textColor-primary rounded px-4 py-3 text-sm hover:text-textColor-secondary hover:bg-btn-hover w-[60px]">
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
          {/* Table Header */}
          <div className="grid grid-cols-4 text-center text-lg border-b border-border_color py-2 font-medium">
            <div className="min-w-[150px]">Shipment ID</div>
            <div className="min-w-[150px]">Item name</div>
            <div className="min-w-[200px]">Quantity</div>
            <div className="min-w-[150px]">Status</div>
          </div>

          <div className="divide-y divide-border_color">
            {loading ? (
              // Skeleton rows
              Array.from({ length: itemsPerPage }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 text-center text-lg py-4 font-normal animate-pulse"
                >
                  <div className="mx-auto w-20 h-5 bg-textColor-tertiary/10 rounded"></div>
                  <div className="mx-auto w-24 h-5 bg-textColor-tertiary/10 rounded"></div>
                  <div className="mx-auto w-16 h-5 bg-textColor-tertiary/10 rounded"></div>
                  <div className="mx-auto w-20 h-5 bg-textColor-tertiary/10 rounded"></div>
                </div>
              ))
            ) : (
              <>
                {paginatedShipments.map((t, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 text-center text-lg py-4 font-normal"
                  >
                    <div>{t.id}</div>
                    <div>{t.name}</div>
                    <div>{t.qty}</div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        t.status === 'Pending' 
                          ? 'bg-yellow-100 text-yellow-800'  
                          : t.status === 'Delivered' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800' // fallback for any other status
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Empty rows to maintain height */}
                {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 text-center text-lg h-[56px] font-normal opacity-50"
                  >
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center border-t border-border_color pt-4 mt-4 text-sm text-textColor-tertiary">
        <div>
          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>–
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredShipments.length)}</span> of
          <span className="font-medium"> {filteredShipments.length} </span> shipments
        </div>
        <nav className="flex items-center gap-1">
          {currentPage > 1 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-2 py-1 hover:text-textColor-primary flex items-center justify-center rounded-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {Array.from({ length: Math.ceil(shipments.length / itemsPerPage) }).map((_, i) => {
            const page = i + 1;
            if (
              page === 1 ||
              page === Math.ceil(shipments.length / itemsPerPage) ||
              Math.abs(page - currentPage) <= 1
            ) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg transition-colors duration-200 ${
                    currentPage === page
                      ? "bg-btn-primary font-medium text-textColor-secondary"
                      : "hover:bg-tbl-hover hover:text-btn-primary text-textColor-primary"
                  }`}
                >
                  {page}
                </button>
              );
            } else if (
              (page === currentPage - 2 && page !== 1) ||
              (page === currentPage + 2 && page !== Math.ceil(shipments.length / itemsPerPage))
            ) {
              return (
                <span key={`ellipsis-${page}`} className="px-2 py-1">
                  ...
                </span>
              );
            }
            return null;
          })}
          {currentPage < Math.ceil(shipments.length / itemsPerPage) && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-2 py-1 hover:text-textColor-primary flex items-center justify-center rounded-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </nav>
      </div>

      {/* Add Shipment Modal - FIXED */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-primary border border-border_color shadow-lg rounded-lg w-[500px] h-[650px] text-textColor-primary font-sans overflow-hidden">
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowAddModal(false);
                setItemPreview(null);
                setNewShipment({ item_id: '', quantity: '', note: '' });
                if (validationTimeout) {
                  clearTimeout(validationTimeout);
                }
              }} 
              disabled={isAddingShipment}
              className="absolute top-4 right-4 w-[34px] h-[34px] flex items-center justify-center disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mx-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <h2 className="absolute top-5 left-7 text-2xl font-semibold">Add New Shipment</h2>

            {/* Form */}
            <div className="absolute top-[80px] left-7 right-7 space-y-6">
              {/* Item ID Input - IMPROVED */}
              <div>
                <label className="block text-xl mb-3">Item ID</label>
                <input
                  type="number"
                  value={newShipment.item_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewShipment(prev => ({ ...prev, item_id: value }));
                    
                    // Clear previous preview immediately on change
                    if (value.trim() === '') {
                      setItemPreview(null);
                      if (validationTimeout) {
                        clearTimeout(validationTimeout);
                      }
                    } else {
                      debouncedValidateItemId(value);
                    }
                  }}
                  disabled={isAddingShipment}
                  min="1"
                  className={`w-full h-[60px] bg-primary border rounded-md text-textColor-primary text-lg px-4 disabled:opacity-50 ${
                    itemPreview?.error ? 'border-red-500' : itemPreview && !itemPreview.error ? 'border-green-500' : 'border-border_color'
                  }`}
                  placeholder="Enter item ID"
                />
                
                {/* Item Preview - IMPROVED */}
                {itemPreview && (
                  <div className={`mt-2 p-3 rounded-md ${
                    itemPreview.error 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    {itemPreview.error ? (
                      <div className="text-red-600 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {itemPreview.error}
                      </div>
                    ) : (
                      <div className="text-green-700 text-sm">
                        <div className="flex items-center mb-1">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <strong>Item Found!</strong>
                        </div>
                        <div><strong>Name:</strong> {itemPreview.name}</div>
                        <div><strong>SKU:</strong> {itemPreview.sku}</div>
                        <div><strong>Category:</strong> {itemPreview.category}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-xl mb-3">Quantity</label>
                <input
                  type="number"
                  value={newShipment.quantity}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, quantity: e.target.value }))}
                  disabled={isAddingShipment}
                  min="1"
                  className="w-full h-[60px] bg-primary border border-border_color rounded-md text-textColor-primary text-lg px-4 disabled:opacity-50"
                  placeholder="Enter quantity"
                />
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-xl mb-3">Note (Optional)</label>
                <textarea
                  value={newShipment.note}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, note: e.target.value }))}
                  disabled={isAddingShipment}
                  rows={4}
                  className="w-full bg-primary border border-border_color rounded-md text-textColor-primary text-lg px-4 py-3 disabled:opacity-50 resize-none"
                  placeholder="Enter any additional notes..."
                />
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="absolute bottom-[32px] right-[32px] flex gap-4">
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setItemPreview(null);
                  setNewShipment({ item_id: '', quantity: '', note: '' });
                  if (validationTimeout) {
                    clearTimeout(validationTimeout);
                  }
                }} 
                disabled={isAddingShipment}
                className="bg-red w-[120px] h-[42px] rounded-md text-textColor-secondary text-[17px] font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddShipment}
                disabled={isAddingShipment || !newShipment.item_id || !newShipment.quantity || itemPreview?.error}
                className="bg-green w-[120px] h-[42px] rounded-md text-textColor-secondary text-[17px] font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isAddingShipment ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED Assign Items Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="relative bg-primary border border-border_color shadow-lg rounded-lg 
                         w-full max-w-[95vw] h-full max-h-[95vh] 
                         sm:max-w-[90vw] sm:max-h-[90vh]
                         md:max-w-[80vw] md:max-h-[85vh] 
                         lg:max-w-[900px] lg:h-[854px]
                         text-textColor-primary font-sans overflow-hidden">
            
            {/* Close Button - Responsive positioning */}
            <button 
              onClick={() => {
                setShowModal(false);
                setSelectedShipmentDetails([]);
                setSelectedProducts(Array(5).fill(''));
              }} 
              disabled={isAssigning}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-[34px] sm:h-[34px] 
                        flex items-center justify-center disabled:opacity-50 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header - Responsive positioning and sizing */}
            <h2 className="absolute top-3 left-4 sm:top-5 sm:left-7 text-lg sm:text-xl lg:text-2xl font-semibold pr-12">
              Assign Items
            </h2>

            {/* Content Container - Enhanced layout */}
            <div className="absolute top-12 sm:top-16 left-4 right-4 sm:left-7 sm:right-7 bottom-20 sm:bottom-24 
                           flex gap-4 sm:gap-6">
              
              {/* Left Panel - Product Selection */}
              <div className="flex-1 flex flex-col space-y-4 sm:space-y-6 min-w-0">
                
                {/* Warehouse Section */}
                <div className="flex-shrink-0">
                  <div className="text-textColor-primary text-base sm:text-lg lg:text-xl mb-2 sm:mb-4">Warehouse</div>
                  <div className="relative w-full h-12 sm:h-14 lg:h-[65px]">
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
                      className="w-full h-full bg-primary border border-border_color rounded-md text-textColor-primary 
                                text-sm sm:text-base lg:text-lg px-3 sm:px-4 appearance-none disabled:opacity-50"
                    >
                      <option value="" disabled>Select a warehouse</option>
                      {warehouses?.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name}
                        </option>
                      ))}
                    </select>
                    {/* Down Arrow Icon */}
                    <div className="pointer-events-none absolute top-1/2 right-3 sm:right-4 transform -translate-y-1/2 text-textColor-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Warehouse Capacity Display */}
                  {selectedWarehouse && (
                    <div className="mt-2 text-sm text-textColor-tertiary">
                      Capacity: {warehouseCapacity.current}/{warehouseCapacity.max} 
                      ({Math.round((warehouseCapacity.current / warehouseCapacity.max) * 100)}% full)
                    </div>
                  )}
                </div>

                {/* Product Selection Section */}
                <div className="flex-shrink-0">
                  <div className="text-textColor-primary text-base sm:text-lg lg:text-xl mb-2 sm:mb-4">Select Product</div>
                  <div className="relative w-full h-12 sm:h-14 lg:h-[65px]">
                    <select
                      value={selectedProducts[0]}
                      onChange={(e) => {
                        const updated = [...selectedProducts];
                        updated[0] = e.target.value;
                        setSelectedProducts(updated);
                      }}
                      disabled={isAssigning}
                      className="w-full h-full bg-primary border border-border_color rounded-md text-textColor-primary 
                                text-sm sm:text-base lg:text-lg px-3 sm:px-4 appearance-none disabled:opacity-50"
                    >
                      <option value="" disabled>Select a product to see shipments</option>
                      {shipmentProducts.map((product, idx) => (
                        <option key={idx} value={product.name}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    {/* Down arrow icon */}
                    <div className="pointer-events-none absolute top-1/2 right-3 sm:right-4 transform -translate-y-1/2 text-textColor-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Available Shipments for Selected Product */}
                {selectedProducts[0] && (
                  <div className="flex-1 border border-border_color rounded-md overflow-hidden flex flex-col min-h-0">
                    <div className="bg-primary/50 px-3 sm:px-4 py-2 border-b border-border_color">
                      <h3 className="text-sm sm:text-base font-medium">
                        Available Shipments for "{selectedProducts[0]}"
                      </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3">
                      {getShipmentsForProduct(selectedProducts[0]).length === 0 ? (
                        <div className="text-center text-textColor-tertiary text-sm py-4">
                          No available shipments for this product
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {getShipmentsForProduct(selectedProducts[0]).map((shipment) => (
                            <div 
                              key={shipment.id}
                              className="flex items-center justify-between p-3 bg-primary/30 rounded-lg hover:bg-primary/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm sm:text-base">
                                  Shipment ID: {shipment.id}
                                </div>
                                <div className="text-xs sm:text-sm text-textColor-tertiary">
                                  Quantity: {shipment.qty}
                                </div>
                              </div>
                              <button
                                onClick={() => addShipmentToSelection(shipment)}
                                disabled={isAssigning}
                                className="ml-3 w-8 h-8 bg-green rounded-md flex items-center justify-center 
                                         disabled:opacity-50 hover:bg-green/80 transition-colors flex-shrink-0"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                                  <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Selected Shipments */}
              <div className="flex-1 border border-border_color rounded-md overflow-hidden flex flex-col min-w-0">
                <div className="bg-primary/50 px-3 sm:px-4 py-2 border-b border-border_color">
                  <h3 className="text-sm sm:text-base font-medium">Selected Shipments ({selectedShipmentDetails.length})</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3">
                  {selectedShipmentDetails.length === 0 ? (
                    <div className="text-center text-textColor-tertiary text-sm py-8">
                      No shipments selected yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedShipmentDetails.map((shipment) => (
                        <div 
                          key={shipment.id}
                          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base text-blue-900">
                              {shipment.name}
                            </div>
                            <div className="text-xs sm:text-sm text-blue-700">
                              Shipment ID: {shipment.id} | Qty: {shipment.quantity}
                            </div>
                          </div>
                          <button
                            onClick={() => removeShipmentFromSelection(shipment.id)}
                            disabled={isAssigning}
                            className="ml-3 w-8 h-8 bg-red rounded-md flex items-center justify-center 
                                     disabled:opacity-50 hover:bg-red/80 transition-colors flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-white">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                {selectedShipmentDetails.length > 0 && (
                  <div className="border-t border-border_color px-3 sm:px-4 py-3 bg-primary/20">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Total Shipments:</span>
                        <span className="font-medium">{selectedShipmentDetails.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Quantity:</span>
                        <span className="font-medium">
                          {selectedShipmentDetails.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Buttons - Responsive positioning and sizing */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 flex gap-2 sm:gap-4">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedShipmentDetails([]);
                  setSelectedProducts(Array(5).fill(''));
                }} 
                disabled={isAssigning}
                className="bg-red w-20 h-9 sm:w-28 sm:h-10 lg:w-[153px] lg:h-[42px] rounded-md 
                          text-textColor-secondary text-sm sm:text-base lg:text-[17px] font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignItems}
                disabled={isAssigning || !selectedWarehouse || selectedShipmentDetails.length === 0}
                className="bg-green w-20 h-9 sm:w-28 sm:h-10 lg:w-[153px] lg:h-[42px] rounded-md 
                          text-textColor-secondary text-sm sm:text-base lg:text-[17px] font-medium 
                          disabled:opacity-50 flex items-center justify-center"
              >
                {isAssigning ? (
                  <span className="hidden sm:inline">Assigning...</span>
                ) : (
                  <span className="hidden sm:inline">Assign</span>
                )}
                <span className="sm:hidden">{isAssigning ? '...' : 'Assign'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipments;