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
        console.log("Warehouse items fetched:", result.data); // Debug log
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

  // Add selected items to transfer list
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
        
        // Try different possible field names for item_id
        let actualItemId = null;
        if (item) {
          actualItemId = item.item_id || item.itemId || item.items?.id || item.id;
          console.log("Trying to find item_id:", {
            'item.item_id': item.item_id,
            'item.itemId': item.itemId,
            'item.items?.id': item.items?.id,
            'item.id': item.id,
            'actualItemId chosen': actualItemId
          });
        }
        
        if (!actualItemId) {
          console.error("❌ No item_id found for warehouse item:", item);
        } else {
          console.log("✅ Found actualItemId:", actualItemId);
        }
        
        return {
          id: itemId, // This is the warehouse_items.id
          itemId: actualItemId, // This should be the items.id
          productId: item?.items?.sku || item?.sku || 'N/A',
          name: item?.items?.name || item?.name || 'Unknown',
          availableQty: item?.quantity || 0,
          selectedQty: quantities[itemId] || 0
        };
      });

    console.log("Items to add before filtering:", itemsToAdd);

    // Filter out items with undefined itemId
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

    setSelectedItems(prev => {
      // Remove duplicates and add new items
      const existingIds = prev.map(item => item.id);
      const newItems = validItems.filter(item => !existingIds.includes(item.id));
      console.log("Adding new items to transfer:", newItems);
      return [...prev, ...newItems];
    });

    // Clear error if we got here successfully
    setTransferError('');

    // Close modal and reset selections
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
  };

  // Get selected warehouse name
  const getSelectedWarehouseName = () => {
    const warehouse = warehouses.find(w => w.id === parseInt(fromWarehouse));
    return warehouse ? warehouse.name : 'Select Warehouse';
  };

  // Handle transfer initiation
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

    setIsTransferring(true);
    setTransferError('');
    setTransferMessage('');

    try {
      // Prepare transfer data
      const transferData = {
        fromWarehouse: parseInt(fromWarehouse),
        toWarehouse: parseInt(toWarehouse),
        items: selectedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.selectedQty
        })),
        createdBy: 'System User' // You can replace this with actual user info
      };

      console.log("Transfer data being sent:", transferData); // Debug log

      const response = await fetch('/api/tracking/create-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData)
      });

      const result = await response.json();

      if (response.ok) {
        setTransferMessage(result.message || 'Transfer completed successfully!');
        
        // Clear the form after successful transfer
        setTimeout(() => {
          closeTransferModal();
          // Refresh the transfers list
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
  
  return (
    <div className="w-full max-w-[100%] min-w-[300px] bg-primary rounded-md px-4 sm:px-6 lg:px-8 py-6 text-textColor-primary font-[Poppins] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="text-[25px] font-semibold">Transfer List</div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <button onClick={() => setShowTransferModal(true)} className="flex items-center gap-2 px-4 py-2 border border-transparent rounded hover:border-btn-hover hover:text-textColor-secondary transition w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            <span className="text-lg hidden sm:inline">Transfer Items</span>
          </button>

          {/* Filter and Cancel */}
          <div className="flex items-center gap-2">
            <div className="relative inline-block">
              <button onClick={() => setFilterOpen(!filterOpen)} className="bg-primary text-secondary rounded px-3 py-2 text-sm hover:text-textColor-secondary hover:bg-violet-600">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="9" y1="18" x2="15" y2="18" />
                </svg>
              </button>
              {filterOpen && (
                <div className="absolute mt-2 bg-primary border border-border_color rounded shadow-md z-10 w-[130px]">
                  <ul className="py-1 text-sm text-textColor-primary text-left">
                    <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Date</a></li>
                    <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Warehouse</a></li>
                    <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Transfer ID</a></li>
                  </ul>
                </div>
              )}
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
            <div className="text-center py-8 text-lg">Loading transfers...</div>
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
          <div className="w-[996px] max-w-[95%] bg-primary border border-border_color rounded-md shadow-lg text-textColor-primary font-[Poppins] relative overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border_color">
              <h2 className="text-2xl font-semibold">Transfer Items</h2>
              <button onClick={closeTransferModal} className="w-8 h-8 hover:bg-border_color rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Messages */}
              {transferMessage && (
                <div className="bg-green/20 border border-green text-green px-4 py-3 rounded-md">
                  {transferMessage}
                </div>
              )}
              
              {transferError && (
                <div className="bg-red/20 border border-red text-red px-4 py-3 rounded-md">
                  {transferError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <label className="text-lg mb-2 block">From:</label>
                  <select 
                    value={fromWarehouse}
                    onChange={handleFromWarehouseChange}
                    disabled={isTransferring}
                    className="w-full border border-border_color rounded-md px-4 py-3 bg-primary text-white appearance-none disabled:opacity-50"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute translate-y-[19%] inset-y-0 right-3 flex items-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <label className="text-lg mb-2 block">To:</label>
                  <select 
                    value={toWarehouse}
                    onChange={(e) => setToWarehouse(e.target.value)}
                    disabled={isTransferring}
                    className="w-full border border-border_color rounded-md px-4 py-3 bg-primary text-white appearance-none disabled:opacity-50"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses
                      .filter(wh => wh.id !== parseInt(fromWarehouse))
                      .map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute translate-y-[19%] inset-y-0 right-3 flex items-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
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
                disabled={selectedItems.length === 0 || !fromWarehouse || !toWarehouse || isTransferring}
                className={`px-6 py-2 rounded-md transition flex items-center gap-2 ${
                  selectedItems.length === 0 || !fromWarehouse || !toWarehouse || isTransferring
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
      )}

      {/* Add Items Modal */}
      {showAddItemsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="w-[996px] max-w-[95%] bg-primary border border-border_color rounded-md p-6 text-textColor-primary font-[Poppins] shadow-xl space-y-6 overflow-y-auto max-h-[95vh] relative">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-medium">{getSelectedWarehouseName()}</h2>
              <button onClick={() => setShowAddItemsModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-border_color/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 font-semibold text-xl border-b border-border_color pb-2 text-white">
              <div className="text-center"></div>
              <div className="text-center">Item SKU</div>
              <div className="text-center">Item</div>
              <div className="text-center">Available Qty</div>
              <div className="text-center">Selected Qty</div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {loadingItems ? (
                <div className="text-center py-8 text-white">Loading items...</div>
              ) : warehouseItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No items found in this warehouse</div>
              ) : (
                warehouseItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 items-center text-white">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedWarehouseItems.includes(item.id)}
                        onChange={() => handleItemSelection(item.id)}
                        className="w-5 h-5 border border-white rounded-md" 
                      />
                    </div>
                    <div className="text-center text-lg">{item.items?.sku || 'N/A'}</div>
                    <div className="text-center text-lg">{item.items?.name || 'Unknown'}</div>
                    <div className="text-center text-lg">{item.quantity}</div>
                    <div className="flex justify-center">
                      <div className="border border-white rounded-md px-3 py-1 w-24">
                        <input 
                          type="number" 
                          min="0" 
                          max={item.quantity}
                          value={quantities[item.id] || ''}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          disabled={!selectedWarehouseItems.includes(item.id)}
                          placeholder="Qty" 
                          className="bg-transparent w-full text-white text-sm text-center outline-none disabled:opacity-50" 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={clearAllSelections}
                className="bg-red hover:bg-red/80 text-white font-medium text-lg px-6 py-2 rounded-md"
              >
                Clear All
              </button>
              <button 
                onClick={addItemsToTransfer}
                disabled={selectedWarehouseItems.length === 0 || !Object.values(quantities).some(q => q > 0)}
                className={`font-medium text-lg px-6 py-2 rounded-md ${
                  selectedWarehouseItems.length === 0 || !Object.values(quantities).some(q => q > 0)
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-green hover:bg-green/80 text-white'
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