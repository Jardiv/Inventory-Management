import { useEffect, useState } from 'react';

const TransferList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  
  // NEW: Warehouse capacity state
  const [warehouseCapacities, setWarehouseCapacities] = useState({});
  const [loadingCapacities, setLoadingCapacities] = useState(false);
  
  // Transfer form state
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Add items modal state
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedWarehouseItems, setSelectedWarehouseItems] = useState([]);
  const [quantities, setQuantities] = useState({});

  // Transfer processing state
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');
  const [transferError, setTransferError] = useState('');

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch("/api/tracking/warehouses");
        const result = await res.json();

        if (res.ok) {
          setWarehouses(result.data);
        } else {
          console.error("Failed to load warehouses:", result.error);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchWarehouses();
  }, []);

  // NEW: Fetch warehouse capacities when transfer modal opens
  useEffect(() => {
    if (showTransferModal && warehouses.length > 0) {
      fetchWarehouseCapacities();
    }
  }, [showTransferModal, warehouses]);

  // NEW: Function to fetch all warehouse capacities
  const fetchWarehouseCapacities = async () => {
    setLoadingCapacities(true);
    const capacities = {};
    
    try {
      await Promise.all(
        warehouses.map(async (warehouse) => {
          try {
            const res = await fetch(`/api/tracking/warehouse-capacity?warehouse_id=${warehouse.id}`);
            const data = await res.json();
            
            if (res.ok) {
              capacities[warehouse.id] = {
                current: data.current_quantity || 0,
                max: data.max_capacity || 0,
                availableSpace: (data.max_capacity || 0) - (data.current_quantity || 0)
              };
            } else {
              console.error(`Failed to fetch capacity for warehouse ${warehouse.id}:`, data.error);
              capacities[warehouse.id] = { current: 0, max: 0, availableSpace: 0 };
            }
          } catch (err) {
            console.error(`Error fetching capacity for warehouse ${warehouse.id}:`, err);
            capacities[warehouse.id] = { current: 0, max: 0, availableSpace: 0 };
          }
        })
      );
      
      setWarehouseCapacities(capacities);
    } catch (err) {
      console.error('Error fetching warehouse capacities:', err);
    } finally {
      setLoadingCapacities(false);
    }
  };

  // NEW: Helper function to check if warehouse can receive items
  const canWarehouseReceiveItems = (warehouseId, itemsToTransfer = []) => {
    const capacity = warehouseCapacities[warehouseId];
    if (!capacity) return false;
    
    const totalToTransfer = itemsToTransfer.reduce((sum, item) => sum + item.selectedQty, 0);
    return capacity.availableSpace >= totalToTransfer;
  };

  // NEW: Helper function to get warehouse capacity info
  const getWarehouseCapacityInfo = (warehouseId) => {
    const capacity = warehouseCapacities[warehouseId];
    if (!capacity) return null;
    
    const percentage = capacity.max > 0 ? (capacity.current / capacity.max) * 100 : 0;
    return {
      ...capacity,
      percentage,
      isFull: percentage >= 100,
      isNearFull: percentage >= 90
    };
  };

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res = await fetch(`/api/tracking/transfers?page=${currentPage}&limit=10`);
        const result = await res.json();

        if (res.ok) {
          const formatted = result.data.map((t) => ({
            id: t.id,
            name: t.items?.name || "Unknown",
            qty: t.quantity,
            date: new Date(t.transfer_date).toLocaleDateString(),
            from: t.from_warehouse?.name || "N/A",
            to: t.to_warehouse?.name || "N/A",
          }));

          setTransfers(formatted);
          setTotalCount(result.total);
          setTotalPages(Math.ceil(result.total / 10));
        } else {
          console.error("Error loading transfers:", result.error);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [currentPage]);

  // Fetch items for selected warehouse
  const fetchWarehouseItems = async (warehouseId) => {
    if (!warehouseId) return;
    
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/tracking/warehouse-storage?warehouse_id=${warehouseId}&limit=1000`);
      const result = await res.json();
      
      if (res.ok) {
        console.log("Warehouse items fetched:", result.data);
        setWarehouseItems(result.data || []);
      } else {
        console.error("Failed to load warehouse items:", result.error);
        setWarehouseItems([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setWarehouseItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  // Handle warehouse selection change
  const handleFromWarehouseChange = (e) => {
    const selectedId = e.target.value;
    setFromWarehouse(selectedId);
    
    // Clear previous selections when warehouse changes
    setSelectedItems([]);
    setSelectedWarehouseItems([]);
    setQuantities({});
    
    // Fetch items for the selected warehouse
    if (selectedId) {
      fetchWarehouseItems(selectedId);
    } else {
      setWarehouseItems([]);
    }
  };

  // NEW: Handle "To" warehouse selection with capacity validation
  const handleToWarehouseChange = (e) => {
    const selectedId = e.target.value;
    
    // Check if this warehouse can receive the current items
    if (selectedId && selectedItems.length > 0) {
      const canReceive = canWarehouseReceiveItems(selectedId, selectedItems);
      const capacityInfo = getWarehouseCapacityInfo(selectedId);
      
      if (!canReceive || capacityInfo?.isFull) {
        const totalToTransfer = selectedItems.reduce((sum, item) => sum + item.selectedQty, 0);
        alert(`Cannot select this warehouse as destination.\n\nWarehouse Capacity: ${capacityInfo?.current || 0}/${capacityInfo?.max || 0}\nAvailable Space: ${capacityInfo?.availableSpace || 0}\nItems to Transfer: ${totalToTransfer}\n\nPlease select a warehouse with sufficient capacity.`);
        return;
      }
    }
    
    setToWarehouse(selectedId);
  };

  // Handle item selection in add items modal
  const handleItemSelection = (itemId) => {
    setSelectedWarehouseItems(prev => {
      if (prev.includes(itemId)) {
        // Remove from selection and clear its quantity
        const newQuantities = { ...quantities };
        delete newQuantities[itemId];
        setQuantities(newQuantities);
        return prev.filter(id => id !== itemId);
      } else {
        // Add to selection
        return [...prev, itemId];
      }
    });
  };

  // Handle quantity change
  const handleQuantityChange = (itemId, value) => {
    const quantity = parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  // UPDATED: Add selected items to transfer list with capacity validation
  const addItemsToTransfer = () => {
    console.log("=== DEBUG: Adding items to transfer ===");
    console.log("Selected warehouse items:", selectedWarehouseItems);
    console.log("Quantities:", quantities);
    console.log("All warehouse items:", warehouseItems);
    
    const itemsToAdd = selectedWarehouseItems
      .filter(itemId => quantities[itemId] && quantities[itemId] > 0)
      .map(itemId => {
        const item = warehouseItems.find(wi => wi.id === itemId);
        
        console.log(`Processing item with id ${itemId}:`, item);
        console.log("Item structure keys:", item ? Object.keys(item) : 'item is null/undefined');
        
        let actualItemId = null;
        if (item) {
          actualItemId = item.item_id;
          console.log("Found actualItemId:", actualItemId);
        }
        
        if (!actualItemId) { 
          console.error("❌ No item_id found for warehouse item:", item);
          console.error("Available fields:", item ? Object.keys(item) : 'none');
        } else {
          console.log("✅ Found actualItemId:", actualItemId);
        }
        
        return {
          id: itemId,
          itemId: actualItemId,
          productId: item?.items?.sku || 'N/A',
          name: item?.items?.name || 'Unknown',
          availableQty: item?.quantity || 0,
          selectedQty: quantities[itemId] || 0
        };
      });

    console.log("Items to add before filtering:", itemsToAdd);

    const validItems = itemsToAdd.filter(item => {
      if (!item.itemId) {
        console.error("❌ Skipping item with undefined itemId:", item);
        return false;
      }
      console.log("✅ Valid item:", item);
      return true;
    });

    console.log("Valid items after filtering:", validItems);

    if (validItems.length !== itemsToAdd.length) {
      setTransferError("Some items have invalid data and were skipped. Please check the console for details.");
      return;
    }

    if (validItems.length === 0) {
      setTransferError("No valid items to add. Please check that items have proper IDs.");
      return;
    }

    // NEW: Check if adding these items would exceed "To" warehouse capacity
    if (toWarehouse) {
      const newItemsTotal = validItems.reduce((sum, item) => sum + item.selectedQty, 0);
      const existingItemsTotal = selectedItems.reduce((sum, item) => sum + item.selectedQty, 0);
      const totalToTransfer = newItemsTotal + existingItemsTotal;
      
      const canReceive = canWarehouseReceiveItems(toWarehouse, [...selectedItems, ...validItems]);
      const capacityInfo = getWarehouseCapacityInfo(toWarehouse);
      
      if (!canReceive) {
        setTransferError(`Cannot add these items. Destination warehouse capacity would be exceeded.\n\nWarehouse Capacity: ${capacityInfo?.current || 0}/${capacityInfo?.max || 0}\nAvailable Space: ${capacityInfo?.availableSpace || 0}\nTotal to Transfer: ${totalToTransfer}`);
        return;
      }
    }

    setSelectedItems(prev => {
      const existingIds = prev.map(item => item.id);
      const newItems = validItems.filter(item => !existingIds.includes(item.id));
      console.log("Adding new items to transfer:", newItems);
      return [...prev, ...newItems];
    });

    setTransferError('');
    setShowAddItemsModal(false);
    setSelectedWarehouseItems([]);
    setQuantities({});
  };

  // Remove item from transfer list
  const removeItemFromTransfer = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Clear all items from transfer
  const clearAllItems = () => {
    setSelectedItems([]);
  };

  // Clear all selections in add items modal
  const clearAllSelections = () => {
    setSelectedWarehouseItems([]);
    setQuantities({});
  };

  // Reset modal state when closing transfer modal
  const closeTransferModal = () => {
    setShowTransferModal(false);
    setFromWarehouse('');
    setToWarehouse('');
    setSelectedItems([]);
    setWarehouseItems([]);
    setTransferMessage('');
    setTransferError('');
    setWarehouseCapacities({});
  };

  // Get selected warehouse name
  const getSelectedWarehouseName = () => {
    const warehouse = warehouses.find(w => w.id === parseInt(fromWarehouse));
    return warehouse ? warehouse.name : 'Select Warehouse';
  };

  // UPDATED: Handle transfer initiation with final capacity check
  const handleInitiateTransfer = async () => {
    if (!fromWarehouse || !toWarehouse || selectedItems.length === 0) {
      setTransferError('Please select warehouses and items for transfer');
      return;
    }

    // Validate that all items have valid itemId
    const invalidItems = selectedItems.filter(item => !item.itemId);
    if (invalidItems.length > 0) {
      setTransferError('Some items have invalid data. Please remove and re-add them.');
      console.error("Invalid items found:", invalidItems);
      return;
    }

    // NEW: Final capacity check before initiating transfer
    const canReceive = canWarehouseReceiveItems(toWarehouse, selectedItems);
    const capacityInfo = getWarehouseCapacityInfo(toWarehouse);
    
    if (!canReceive) {
      const totalToTransfer = selectedItems.reduce((sum, item) => sum + item.selectedQty, 0);
      setTransferError(`Transfer cannot be completed. Destination warehouse capacity would be exceeded.\n\nWarehouse: ${capacityInfo?.current || 0}/${capacityInfo?.max || 0}\nAvailable Space: ${capacityInfo?.availableSpace || 0}\nItems to Transfer: ${totalToTransfer}`);
      return;
    }

    setIsTransferring(true);
    setTransferError('');
    setTransferMessage('');

    try {
      const transferData = {
        fromWarehouse: parseInt(fromWarehouse),
        toWarehouse: parseInt(toWarehouse),
        items: selectedItems.map(item => ({
          itemId: parseInt(item.itemId),
          quantity: parseInt(item.selectedQty)
        })),
        createdBy: 'System User'
      };

      console.log("=== FRONTEND DEBUG ===");
      console.log("Transfer data being sent:", transferData);
      console.log("Selected items raw:", selectedItems);

      const response = await fetch('/api/tracking/create-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData)
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (response.ok) {
        setTransferMessage(result.message || 'Transfer completed successfully!');
        
        setTimeout(() => {
          closeTransferModal();
          const fetchTransfers = async () => {
            try {
              const res = await fetch(`/api/tracking/transfers?page=${currentPage}&limit=10`);
              const result = await res.json();

              if (res.ok) {
                const formatted = result.data.map((t) => ({
                  id: t.id,
                  name: t.items?.name || "Unknown",
                  qty: t.quantity,
                  date: new Date(t.transfer_date).toLocaleDateString(),
                  from: t.from_warehouse?.name || "N/A",
                  to: t.to_warehouse?.name || "N/A",
                }));

                setTransfers(formatted);
                setTotalCount(result.total);
                setTotalPages(Math.ceil(result.total / 10));
              }
            } catch (err) {
              console.error("Fetch error:", err);
            }
          };
          fetchTransfers();
        }, 2000);
      } else {
        setTransferError(result.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferError('Network error occurred during transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  const emptyRows = Math.max(11 - transfers.length, 0);

  // NEW: Floating Capacity Panel Component - Now Standalone
  const FloatingCapacityPanel = ({ warehouseId, selectedItems }) => {
    const capacityInfo = getWarehouseCapacityInfo(warehouseId);
    const totalToTransfer = selectedItems.reduce((sum, item) => sum + item.selectedQty, 0);
    const selectedWarehouse = warehouses.find(w => w.id === parseInt(warehouseId));

    if (!capacityInfo || !selectedWarehouse) return null;

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{selectedWarehouse.name}</h3>
          <div className={`w-3 h-3 rounded-full ${
            capacityInfo.isFull 
              ? 'bg-red-500' 
              : capacityInfo.isNearFull 
              ? 'bg-yellow-500' 
              : 'bg-green-500'
          }`} />
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Current Capacity:</span>
            <span className={`font-medium ${
              capacityInfo.percentage >= 90 
                ? 'text-red-400' 
                : capacityInfo.percentage >= 70 
                ? 'text-yellow-400' 
                : 'text-green-400'
            }`}>
              {capacityInfo.current}/{capacityInfo.max}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Usage:</span>
            <span className="text-white font-medium">
              {capacityInfo.percentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Available Space:</span>
            <span className={`font-medium ${
              capacityInfo.availableSpace <= 0 
                ? 'text-red-400' 
                : capacityInfo.availableSpace < 50 
                ? 'text-yellow-400' 
                : 'text-green-400'
            }`}>
              {capacityInfo.availableSpace}
            </span>
          </div>
          
          {totalToTransfer > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">To Transfer:</span>
                <span className={`font-medium ${
                  totalToTransfer > capacityInfo.availableSpace 
                    ? 'text-red-400' 
                    : 'text-blue-400'
                }`}>
                  {totalToTransfer}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">After Transfer:</span>
                <span className={`font-medium ${
                  (capacityInfo.current + totalToTransfer) > capacityInfo.max 
                    ? 'text-red-400' 
                    : 'text-green-400'
                }`}>
                  {capacityInfo.current + totalToTransfer}/{capacityInfo.max}
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Visual Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
            {/* Current capacity */}
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                capacityInfo.percentage >= 90 
                  ? 'bg-red-500' 
                  : capacityInfo.percentage >= 70 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(capacityInfo.percentage, 100)}%` }}
            />
            
            {/* Projected capacity overlay */}
            {totalToTransfer > 0 && (
              <div 
                className="absolute top-0 h-3 bg-blue-400 opacity-60 transition-all duration-300"
                style={{ 
                  left: `${Math.min(capacityInfo.percentage, 100)}%`,
                  width: `${Math.min(((totalToTransfer) / capacityInfo.max) * 100, 100 - Math.min(capacityInfo.percentage, 100))}%` 
                }}
              />
            )}
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>{capacityInfo.max}</span>
          </div>
          
          {totalToTransfer > 0 && (
            <div className="text-xs text-blue-400 mt-2 text-center">
              Blue section shows projected capacity after transfer
            </div>
          )}
        </div>
        
        {/* Status Indicator */}
        <div className={`mt-4 p-2 rounded-md text-center text-sm font-medium ${
          totalToTransfer > capacityInfo.availableSpace
            ? 'bg-red-900/30 text-red-400 border border-red-500/30'
            : capacityInfo.isFull
            ? 'bg-red-900/30 text-red-400 border border-red-500/30'
            : capacityInfo.isNearFull
            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
            : 'bg-green-900/30 text-green-400 border border-green-500/30'
        }`}>
          {totalToTransfer > capacityInfo.availableSpace
            ? 'CAPACITY EXCEEDED'
            : capacityInfo.isFull
            ? 'WAREHOUSE FULL'
            : capacityInfo.isNearFull
            ? 'NEAR CAPACITY'
            : 'CAPACITY OK'
          }
        </div>
      </>
    );
  };
  
  return (
    <div className="w-full max-w-[100%] min-w-[300px] bg-primary rounded-md px-4 sm:px-6 lg:px-8 py-6 text-textColor-primary font-[Poppins] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="text-[25px] font-semibold">Transfer List</div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <button onClick={() => setShowTransferModal(true)} className="flex items-center gap-2 px-4 py-2 border border-transparent rounded hover:border-btn-hover transition w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            <span className="text-lg hidden sm:inline">Transfer Items</span>
          </button>

          {/* Filter and Cancel */}
          <div className="flex items-center gap-2">
            <div className="relative inline-block">
            </div>
            <a href="/tracking/Dashboard">
              <button className="bg-primary text-secondary rounded px-3 py-2 text-sm hover:text-textColor-secondary hover:bg-violet-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-w-[700px]">
        <div className="grid grid-cols-6 text-center text-lg border-b border-border_color py-2 font-medium">
          <div className="min-w-[150px]">Transfer ID</div>
          <div className="min-w-[200px]">Item Name</div>
          <div className="min-w-[150px]">Transferred Qty.</div>
          <div className="min-w-[200px]">Date</div>
          <div className="min-w-[150px]">From</div>
          <div className="min-w-[150px]">To</div>
        </div>
        <div className="divide-y divide-border_color">
          {loading ? (
            Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="grid grid-cols-6 text-center text-lg py-4 font-normal animate-pulse"
              >
                {Array.from({ length: 6 }).map((__, colIdx) => (
                  <div
                    key={`skeleton-cell-${idx}-${colIdx}`}
                    className="mx-auto h-5 bg-gray-700/50 rounded w-[70%]"
                  />
                ))}
              </div>
            ))
          ) : (
            transfers.map(t => (
              <div key={t.id} className="grid grid-cols-6 text-center text-lg py-4 font-normal">
                <div>{t.id}</div>
                <div>{t.name}</div>
                <div>{t.qty}</div>
                <div>{t.date}</div>
                <div>{t.from}</div>
                <div>{t.to}</div>
              </div>
            ))
          )}
          {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map((_, idx) => (
            <div key={`empty-${idx}`} className="grid grid-cols-6 text-center text-lg py-4 font-normal opacity-50">
              <div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center border-t border-border_color pt-4 mt-4">
        <div>
          Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>–
          <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> of
          <span className="font-medium"> {totalCount} </span> transfers
        </div>
        <nav className="flex items-center gap-1">
          {currentPage > 1 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-2 py-1 hover:text-gray-700 flex items-center justify-center rounded-full"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            if (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1
            ) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg transition-colors duration-200 ${
                    currentPage === page
                      ? "bg-[#8A00C4] font-medium text-white"
                      : "hover:bg-tbl-hover hover:text-[#8A00C4] text-textColor-primary"
                  }`}
                >
                  {page}
                </button>
              );
            } else if (
              (page === currentPage - 2 && page !== 1) ||
              (page === currentPage + 2 && page !== totalPages)
            ) {
              return (
                <span key={`ellipsis-${page}`} className="px-2 py-1">
                  ...
                </span>
              );
            }
            return null;
          })}

          {currentPage < totalPages && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-2 py-1 hover:text-gray-700 flex items-center justify-center rounded-full"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </nav>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative flex items-center gap-4">
            {/* Main Modal */}
            <div className="w-[996px] max-w-[95%] bg-primary border border-border_color rounded-md shadow-lg text-textColor-primary font-[Poppins] overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border_color">
              <h2 className="text-2xl font-semibold">Transfer Items</h2>
              <button onClick={closeTransferModal} className="w-8 h-8 hover:bg-border_color rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Loading Capacities Indicator */}
              {loadingCapacities && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
                  Loading warehouse capacities...
                </div>
              )}

              {/* Status Messages */}
              {transferMessage && (
                <div className="bg-green/20 border border-green text-green px-4 py-3 rounded-md">
                  {transferMessage}
                </div>
              )}
              
              {transferError && (
                <div className="bg-red/20 border border-red text-red px-4 py-3 rounded-md whitespace-pre-line">
                  {transferError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {/* From Warehouse */}
                <div className="relative">
                  <label className="text-lg mb-2 block">From:</label>
                  <div className="relative">
                    <select 
                      value={fromWarehouse}
                      onChange={handleFromWarehouseChange}
                      disabled={isTransferring || loadingCapacities}
                      className="w-full border border-border_color rounded-md px-4 py-3 pr-10 bg-primary appearance-none disabled:opacity-50"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map((wh) => {
                        const capacityInfo = getWarehouseCapacityInfo(wh.id);
                        return (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} {capacityInfo ? `(${capacityInfo.current}/${capacityInfo.max})` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-textColor-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* To Warehouse with Capacity Info Button */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-lg">To:</label>
                    {toWarehouse && !loadingCapacities && (
                      <div className="relative group">
                        <button
                          type="button"
                          className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                        >
                          ?
                        </button>
                        
                        {/* Tooltip with Capacity Panel */}
                        <div className="absolute left-8 top-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[70]">
                          <div className="w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4">
                            <FloatingCapacityPanel 
                              warehouseId={toWarehouse} 
                              selectedItems={selectedItems}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <select 
                      value={toWarehouse}
                      onChange={handleToWarehouseChange}
                      disabled={isTransferring || loadingCapacities}
                      className="w-full border border-border_color rounded-md px-4 py-3 pr-10 bg-primary appearance-none disabled:opacity-50"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses
                        .filter(wh => wh.id !== parseInt(fromWarehouse))
                        .map((wh) => {
                          const capacityInfo = getWarehouseCapacityInfo(wh.id);
                          const totalToTransfer = selectedItems.reduce((sum, item) => sum + item.selectedQty, 0);
                          const canReceive = capacityInfo ? capacityInfo.availableSpace >= totalToTransfer : true;
                          
                          return (
                            <option 
                              key={wh.id} 
                              value={wh.id}
                              disabled={capacityInfo?.isFull || (totalToTransfer > 0 && !canReceive)}
                              className={capacityInfo?.isFull || (totalToTransfer > 0 && !canReceive) ? 'text-gray-400' : ''}
                            >
                              {wh.name} {capacityInfo ? `(${capacityInfo.current}/${capacityInfo.max})` : ''} 
                              {capacityInfo?.isFull ? ' - FULL' : capacityInfo?.isNearFull ? ' - NEAR FULL' : ''}
                            </option>
                          );
                        })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-textColor-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border_color rounded-md p-4 space-y-4">
                <div className="grid grid-cols-5 text-lg font-medium border-b border-border_color pb-2">
                  <div>Product ID</div>
                  <div>Product</div>
                  <div className="text-center">Available Qty</div>
                  <div className="text-center">Selected Qty</div>
                  <div className="text-center">Action</div>
                </div>

                <div className="divide-y divide-border_color max-h-[300px] overflow-y-auto">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No items selected for transfer
                    </div>
                  ) : (
                    selectedItems.map(item => (
                      <div key={item.id} className="grid grid-cols-5 py-3 items-center">
                        <div>{item.productId}</div>
                        <div>{item.name}</div>
                        <div className="text-center">{item.availableQty}</div>
                        <div className="text-center">{item.selectedQty}</div>
                        <div className="text-center">
                          <button 
                            onClick={() => removeItemFromTransfer(item.id)}
                            disabled={isTransferring}
                            className="text-red hover:text-red/80 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.121-11.121a1 1 0 10-1.414-1.414L10 8.586 8.293 6.879a1 1 0 10-1.414 1.414L8.586 10l-1.707 1.707a1 1 0 101.414 1.414L10 11.414l1.707 1.707a1 1 0 001.414-1.414L11.414 10l1.707-1.707z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowAddItemsModal(true)}
                    disabled={!fromWarehouse || isTransferring}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                      !fromWarehouse || isTransferring
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                        : 'bg-green hover:bg-green/80 text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
                    Add items to transfer
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 p-6 border-t border-border_color">
              <button 
                onClick={clearAllItems}
                disabled={isTransferring}
                className="bg-red hover:bg-red/80 text-white px-6 py-2 rounded-md transition disabled:opacity-50"
              >
                Clear All
              </button>
              <button 
                onClick={handleInitiateTransfer}
                disabled={selectedItems.length === 0 || !fromWarehouse || !toWarehouse || isTransferring || loadingCapacities}
                className={`px-6 py-2 rounded-md transition flex items-center gap-2 ${
                  selectedItems.length === 0 || !fromWarehouse || !toWarehouse || isTransferring || loadingCapacities
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-green hover:bg-green/80 text-white'
                }`}
              >
                {isTransferring && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isTransferring ? 'Processing...' : 'Initiate Transfer'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Items Modal */}
      {showAddItemsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="w-[996px] max-w-[95%] bg-primary border border-border_color rounded-md p-6 text-textColor-primary font-sans shadow-xl space-y-6 overflow-y-auto max-h-[95vh] relative">
            
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-medium">{getSelectedWarehouseName()}</h2>
              <button 
                onClick={() => setShowAddItemsModal(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-border_color/20 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-textColor-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 font-semibold text-xl border-b border-border_color pb-2 text-textColor-primary">
              <div className="text-center"></div>
              <div className="text-center">Item SKU</div>
              <div className="text-center">Item</div>
              <div className="text-center">Available Qty</div>
              <div className="text-center">Selected Qty</div>
            </div>

            {/* Table Content */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {loadingItems ? (
                <div className="text-center py-8 text-textColor-primary">Loading items...</div>
              ) : warehouseItems.filter(item => item.quantity > 0).length === 0 ? (
                <div className="text-center py-8 text-textColor-tertiary">
                  No items found in this warehouse
                </div>
              ) : (
                warehouseItems
                  .filter(item => item.quantity > 0)
                  .map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 items-center text-textColor-primary">
                      {/* Checkbox */}
                      <div className="flex justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedWarehouseItems.includes(item.id)}
                          onChange={() => handleItemSelection(item.id)}
                          className="w-5 h-5 border border-border_color rounded-md accent-btn-primary" 
                        />
                      </div>

                      {/* Item SKU */}
                      <div className="text-center text-lg">{item.items?.sku || 'N/A'}</div>
                      
                      {/* Item Name */}
                      <div className="text-center text-lg">{item.items?.name || 'Unknown'}</div>
                      
                      {/* Available Qty */}
                      <div className="text-center text-lg">{item.quantity}</div>
                      
                      {/* Selected Qty Input */}
                      <div className="flex justify-center">
                        <div className="border border-border_color rounded-md px-3 py-1 w-24">
                          <input 
                            type="number" 
                            min="0" 
                            max={item.quantity}
                            value={quantities[item.id] || ''}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            disabled={!selectedWarehouseItems.includes(item.id)}
                            placeholder="Qty" 
                            className="bg-transparent w-full text-textColor-primary text-sm text-center outline-none disabled:opacity-50 placeholder:text-textColor-tertiary" 
                          />
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between pt-4">
              <button 
                onClick={clearAllSelections}
                className="bg-red hover:bg-red/80 text-textColor-secondary font-medium text-lg px-6 py-2 rounded-md transition"
              >
                Clear All
              </button>
              <button 
                onClick={addItemsToTransfer}
                disabled={selectedWarehouseItems.length === 0 || !Object.values(quantities).some(q => q > 0)}
                className={`font-medium text-lg px-6 py-2 rounded-md transition ${
                  selectedWarehouseItems.length === 0 || !Object.values(quantities).some(q => q > 0)
                    ? 'bg-textColor-tertiary/20 text-textColor-tertiary cursor-not-allowed'
                    : 'bg-green hover:bg-green/80 text-textColor-secondary'
                }`}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferList;