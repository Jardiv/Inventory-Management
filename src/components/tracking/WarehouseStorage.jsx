import { useEffect, useState } from 'react';

export default function WarehouseStorage({ initialItems, total, limit, page }) {
  const [items, setItems] = useState(initialItems || []);
  const [selectedWarehouse, setSelectedWarehouse] = useState('1');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [warehouseList, setWarehouseList] = useState([]);

  // Form states for the modal
  const [warehouseName, setWarehouseName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(page);
  const [filteredTotal, setFilteredTotal] = useState(total || 0);
  const totalPages = Math.ceil(filteredTotal / limit);
  const [currentDate, setCurrentDate] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const parsedPage = parseInt(urlParams.get('page')) || 1;
      setCurrentPage(parsedPage);
    }
  }, []);

  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const warehouseId = urlParams.get('warehouse_id');
      if (warehouseId) {
        setSelectedWarehouse(warehouseId);
      }
    }, []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/tracking/warehouses');
        const result = await res.json();
        
        // Sort warehouses by ID to ensure consistent ordering
        const sortedWarehouses = (result.data || []).sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setWarehouseList(sortedWarehouses);
        
        if (sortedWarehouses && sortedWarehouses.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const warehouseIdFromURL = urlParams.get('warehouse_id');

          if (!warehouseIdFromURL) {
            // Always default to warehouse with ID "1" if it exists, otherwise use the first one
            const defaultWarehouse = sortedWarehouses.find(w => w.id === '1' || w.id === 1) || sortedWarehouses[0];
            setSelectedWarehouse(String(defaultWarehouse.id));
          }
        }
      } catch (err) {
        console.error("Error fetching warehouses", err);
      }
    };

    fetchWarehouses();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tracking/warehouse-storage?page=${page}&limit=${limit}&warehouse_id=${selectedWarehouse}`);
        const result = await res.json();
        setItems(result.data || []);
        setFilteredTotal(result.count || 0);
      } catch (err) {
        console.error("Error fetching items", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedWarehouse, page]);

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formatted);
  }, []);

  // Function to handle warehouse request submission
  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!warehouseName.trim()) {
      setSubmitMessage('Warehouse name is required');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/tracking/warehouse-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouse_name: warehouseName,
          description: description
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        setSubmitMessage('Warehouse request submitted successfully!');
        
        // Clear form
        setWarehouseName('');
        setDescription('');
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowModal(false);
          setSubmitMessage('');
        }, 2000);
      } else {
        // Error from API
        setSubmitMessage(result.error || 'Failed to submit warehouse request');
      }
    } catch (error) {
      console.error('Error submitting warehouse request:', error);
      setSubmitMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to reset modal state when closing
  const handleCloseModal = () => {
    setShowModal(false);
    setWarehouseName('');
    setDescription('');
    setSubmitMessage('');
    setIsSubmitting(false);
  };

  return (
    <div>
      {/* Top Bar with Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <h2 className="text-2xl font-semibold">
            {warehouseList.find(w => String(w.id) === selectedWarehouse)?.name}
          </h2>

          {/* Select Warehouse */}
          <div className="relative">
            <button
              onClick={() => {
                const dropdown = document.getElementById('warehouse-dropdown');
                dropdown?.classList.toggle('hidden');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-transparent rounded hover:border-btn-hover transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div id="warehouse-dropdown" className="hidden absolute left-1/2 -translate-x-1/2 mt-2 bg-primary border border-border_color rounded shadow-md z-10 w-[200px] max-h-[200px] overflow-y-auto">
              <ul className="py-1 text-sm text-textColor-primary text-left">
                {warehouseList.map(w => (
                  <li key={w.id}>
                    <button
                      onClick={() => {
                        setSelectedWarehouse(w.id);
                        document.getElementById('warehouse-dropdown')?.classList.add('hidden');
                        window.location.href = `?page=1&warehouse_id=${w.id}`;
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-btn-hover"
                    >
                      {w.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center">
          {/* Add Warehouse Button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-transparent rounded hover:border-btn-hover transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          
          {/* Download button */}
          <a href={`/tracking/warehouse-overview?warehouse_id=${selectedWarehouse}`}>
            <button className="bg-primary text-secondary rounded px-3 py-2 text-sm hover:text-textColor-secondary hover:bg-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          </a>

          {/* Cancel Button with Link to Dashboard */}
          <a href="/tracking/Dashboard">
            <button className="bg-primary text-secondary rounded px-3 py-2 text-sm hover:text-textColor-secondary hover:bg-violet-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </a>
        </div>
      </div>

      {/* Modal for Add Warehouse */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-primary text-textColor-primary rounded-md w-[400px] p-6 shadow-lg border border-border_color relative">
            <h2 className="text-xl font-semibold mb-4">Add New Warehouse</h2>

            <form onSubmit={handleWarehouseSubmit}>
              {/* Warehouse Name Input */}
              <label className="block mb-1">Warehouse Name</label>
              <input
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="Enter warehouse name"
                className="w-full border border-border_color rounded px-3 py-2 mb-4 bg-primary text-textColor-primary"
                required
                disabled={isSubmitting}
              />

              {/* Description Input */}
              <label className="block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter warehouse description"
                className="w-full border border-border_color rounded px-3 py-2 mb-4 bg-primary text-textColor-primary"
                rows={3}
                disabled={isSubmitting}
              />

              {/* Other Form Fields */}
              <div className="text-sm text-textColor-tertiary mb-4">
                Requested By: <span className="font-medium text-textColor-primary">Inventory module</span><br />
                Requested Date: <span className="font-medium text-textColor-primary">{currentDate}</span>
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div className={`text-sm mb-4 p-2 rounded ${
                  submitMessage.includes('successfully') 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {submitMessage}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-red text-white rounded hover:bg-red/80"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green text-white rounded hover:bg-green/80 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Continue with Table & Pagination UI */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-left text-sm font-medium">
            <th className="px-4 py-2 w-[120px]">SKU</th>
            <th className="px-4 py-2 w-[120px]">
              <div className="flex items-center gap-1">
                <span>Name</span>
                <div className="flex flex-col leading-none">
                  {/* Ascending */}
                  <button
                    onClick={() => {
                      setSortColumn("name");
                      setSortOrder(sortOrder === "asc" && sortColumn === "name" ? null : "asc");
                    }}
                    className={`${sortColumn === "name" && sortOrder === "asc" ? "text-violet-500" : "text-gray-400"} hover:text-violet-600`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 15.75 7.5-7.5 7.5 7.5"
                      />
                    </svg>
                  </button>

                  {/* Descending */}
                  <button
                    onClick={() => {
                      setSortColumn("name");
                      setSortOrder(sortOrder === "desc" && sortColumn === "name" ? null : "desc");
                    }}
                    className={`${sortColumn === "name" && sortOrder === "desc" ? "text-violet-500" : "text-gray-400"} hover:text-violet-600`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </th>
            <th className="px-4 py-2 w-[80px]">
              <div className="flex items-center gap-1">
                <span>Qty</span>
                <div className="flex flex-col leading-none">
                  {/* Ascending */}
                  <button
                    onClick={() => {
                      setSortColumn("quantity");
                      setSortOrder(sortOrder === "asc" && sortColumn === "quantity" ? null : "asc");
                    }}
                    className={`${sortColumn === "quantity" && sortOrder === "asc" ? "text-violet-500" : "text-gray-400"} hover:text-violet-600`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 15.75 7.5-7.5 7.5 7.5"
                      />
                    </svg>
                  </button>

                  {/* Descending */}
                  <button
                    onClick={() => {
                      setSortColumn("quantity");
                      setSortOrder(sortOrder === "desc" && sortColumn === "quantity" ? null : "desc");
                    }}
                    className={`${sortColumn === "quantity" && sortOrder === "desc" ? "text-violet-500" : "text-gray-400"} hover:text-violet-600`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </th>
            <th className="px-4 py-2 w-[140px]">Category</th>
            <th className="px-4 py-2 w-[100px]">Date Assigned</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? // Skeleton Rows (10 placeholders)
              [...Array(10)].map((_, i) => (
                <tr
                  key={`skeleton-${i}`}
                  className={`border-t border-border_color ${
                    i === 9 ? "border-b-0" : "border-b border-border_color"
                  }`}
                >
                  {["w-[120px]", "w-[120px]", "w-[80px]", "w-[140px]", "w-[160px]"].map(
                    (width, idx) => (
                      <td key={idx} className={`py-3 px-4 ${width}`}>
                        <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                      </td>
                    )
                  )}
                </tr>
              ))
            : // Actual Data Rows
              (items || [])
                .sort((a, b) => {
                  if (!sortOrder || !sortColumn) return 0;
                  let valA, valB;
                  if (sortColumn === "name") {
                    valA = a.items?.name?.toLowerCase() || "";
                    valB = b.items?.name?.toLowerCase() || "";
                  } else if (sortColumn === "quantity") {
                    valA = a.quantity ?? 0;
                    valB = b.quantity ?? 0;
                  }
                  if (sortOrder === "asc") return valA > valB ? 1 : valA < valB ? -1 : 0;
                  if (sortOrder === "desc") return valA < valB ? 1 : valA > valB ? -1 : 0;
                  return 0;
                })
                .slice(0, 10)
                .map((item, index) => (
                  <tr
                    key={index}
                    className={`border-t border-border_color ${
                      index === 9 ? "border-b-0" : "border-b border-border_color"
                    }`}
                  >
                    <td className="py-3 px-4 w-[120px]">{item.items?.sku || ""}</td>
                    <td className="py-3 px-4 w-[120px]">{item.items?.name || ""}</td>
                    <td className="py-3 px-4 w-[80px]">{item.quantity ?? ""}</td>
                    <td className="py-3 px-4 w-[140px]">
                      {item.items?.category?.name || ""}
                    </td>
                    <td className="py-3 px-4 w-[160px]">
                      {item.date_assigned || ""}
                    </td>
                  </tr>
                ))}

          {/* Empty rows if less than 10 items */}
          {!loading &&
            [...Array(Math.max(0, 10 - items.length))].map((_, i) => (
              <tr
                key={`empty-${i}`}
                className={`border-t border-border_color ${
                  items.length + i === 9 ? "border-b-0" : "border-b border-border_color"
                }`}
              >
                <td className="py-3 px-4 w-[120px]">&nbsp;</td>
                <td className="py-3 px-4 w-[200px]">&nbsp;</td>
                <td className="py-3 px-4 w-[80px]">&nbsp;</td>
                <td className="py-3 px-4 w-[140px]">&nbsp;</td>
                <td className="py-3 px-4 w-[160px]">&nbsp;</td>
              </tr>
            ))}
        </tbody>
        </table>
      </div>

      {/* Pagination UI */}
      <div className="flex justify-between items-center border-t border-border_color pt-4 mt-4">
        <div>
          Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span>–
          <span className="font-medium">{Math.min(currentPage * limit, filteredTotal)}</span> of{' '}
          <span className="font-medium">{filteredTotal}</span> products
        </div>
        <nav className="flex items-center gap-1">
          {page > 1 && (
            <a href={`?page=${page - 1}&warehouse_id=${selectedWarehouse}`} className="px-2 py-1 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </a>
          )}
          {[...Array(totalPages)].map((_, i) => {
            const current = i + 1;
            if (current === 1 || current === totalPages || Math.abs(current - page) <= 1) {
              return (
                <a key={current} href={`?page=${current}&warehouse_id=${selectedWarehouse}`} className={`px-3 py-1.5 rounded-lg transition-colors duration-200 ${page === current ? "bg-[#8A00C4] font-medium text-white": "hover:bg-tbl-hover hover:text-[#8A00C4] text-textColor-primary"}`}>{current}</a>
              );
            } else if ((current === page - 2 && current !== 1) || (current === page + 2 && current !== totalPages)) {
              return <span key={`ellipsis-${current}`} className="px-2 py-1 ">...</span>;
            }
            return null;
          })}
          {page < totalPages && (
            <a href={`?page=${page + 1}&warehouse_id=${selectedWarehouse}`} className="px-2 py-1 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </a>
          )}
        </nav>
      </div>
    </div>
  );
}