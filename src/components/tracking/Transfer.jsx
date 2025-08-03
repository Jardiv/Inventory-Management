import { useEffect, useState } from 'react';

const TransferList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // update from API
  const [totalCount, setTotalCount] = useState(0);

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
            date: new Date(t.date).toLocaleDateString(),
            from: t.from_warehouse?.name || "N/A",
            to: t.to_warehouse?.name || "N/A",
          }));

          setTransfers(formatted);
          setTotalCount(result.total); // ✅ moved here
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
      <div className="flex justify-between items-center border-t border-border_color pt-4 mt-4 text-sm text-gray-700">
        <div>
          Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>–
          <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> of
          <span className="font-medium"> {totalCount} </span> transfers
        </div>
        <nav className="flex items-center gap-1">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="px-2 py-1 text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === i + 1 ? 'bg-[#8A00C4] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {i + 1}
            </button>
          ))}

          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="px-2 py-1 text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </nav>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="w-[996px] max-w-[95%] bg-primary border border-border_color rounded-md shadow-lg text-textColor-primary font-[Poppins] relative overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border_color">
              <h2 className="text-2xl font-semibold">Transfer Items</h2>
              <button onClick={() => setShowTransferModal(false)} className="w-8 h-8 hover:bg-border_color rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {['From', 'To'].map((label, i) => (
                  <div key={label} className="relative">
                    <label className="text-lg mb-2 block">{label}:</label>
                    <select className="w-full border border-border_color rounded-md px-4 py-3 bg-primary text-white appearance-none">
                      <option value="" disabled selected>Select Warehouse</option>
                      <option value="wh1">Warehouse 1</option>
                      <option value="wh2">Warehouse 2</option>
                      <option value="wh3">Warehouse 3</option>
                    </select>
                    <div className="pointer-events-none absolute translate-y-[19%] inset-y-0 right-3 flex items-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ))}
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
                  <div className="grid grid-cols-5 py-3 items-center">
                    <div>1741</div>
                    <div>Product 1</div>
                    <div className="text-center">0</div>
                    <div className="text-center">0</div>
                    <div className="text-center">
                      <button className="text-red hover:text-red/80">
                        <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.121-11.121a1 1 0 10-1.414-1.414L10 8.586 8.293 6.879a1 1 0 10-1.414 1.414L8.586 10l-1.707 1.707a1 1 0 101.414 1.414L10 11.414l1.707 1.707a1 1 0 001.414-1.414L11.414 10l1.707-1.707z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => { setShowAddItemsModal(true); }} className="flex items-center gap-2 bg-green hover:bg-green/80 text-white px-4 py-2 rounded-md transition">
                    <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
                    Add items to transfer
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 p-6 border-t border-border_color">
              <button className="bg-red hover:bg-red/80 text-white px-6 py-2 rounded-md transition">Clear All</button>
              <button className="bg-green hover:bg-green/80 text-white px-6 py-2 rounded-md transition">Initiate Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Items Modal */}
      {showAddItemsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="w-[996px] max-w-[95%] bg-primary border border-border_color rounded-md p-6 text-textColor-primary font-[Poppins] shadow-xl space-y-6 overflow-y-auto max-h-[95vh] relative">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-medium">Warehouse 1</h2>
              <button onClick={() => setShowAddItemsModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-border_color/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 font-semibold text-xl border-b border-border_color pb-2 text-white">
              <div className="text-center"></div>
              <div className="text-center">Item ID</div>
              <div className="text-center">Item</div>
              <div className="text-center">Available Qty</div>
              <div className="text-center">Selected Qty</div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 items-center text-white">
              <div className="flex justify-center"><input type="checkbox" className="w-5 h-5 border border-white rounded-md" /></div>
              <div className="text-center text-lg">1761</div>
              <div className="text-center text-lg">Product 1</div>
              <div className="text-center text-lg">100</div>
              <div className="flex justify-center">
                <div className="border border-white rounded-md px-3 py-1 w-24">
                  <input list="qty-options" type="number" min="0" placeholder="Qty" className="bg-transparent w-full text-white text-sm text-center outline-none" />
                  <datalist id="qty-options">
                    <option value="5" />
                    <option value="10" />
                    <option value="15" />
                  </datalist>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button className="bg-red hover:bg-red/80 text-white font-medium text-lg px-6 py-2 rounded-md">Clear All</button>
              <button className="bg-green hover:bg-green/80 text-white font-medium text-lg px-6 py-2 rounded-md">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferList;
