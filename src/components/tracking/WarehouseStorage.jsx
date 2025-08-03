import { useEffect, useState } from 'react';


const warehouseList = [
  { id: '1', name: 'Warehouse 1' },
  { id: '2', name: 'Warehouse 2' },
  { id: '3', name: 'Warehouse 3' }
];


export default function WarehouseStorage({ initialItems, total, limit, page }) {
  const [items] = useState(initialItems);
  const [showModal, setShowModal] = useState(false);

  const currentPage = page || 1;
  const totalPages = Math.ceil((total || 0) / (limit || 10));
  
  

  return (
    <div>
      {/* Top Bar with Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <h2 className="text-2xl font-semibold">Warehouse 1</h2>

          {/* Select Warehouse */}
          <div className="relative">
            <button
              onClick={() => {
                const dropdown = document.getElementById('warehouse-dropdown');
                dropdown?.classList.toggle('hidden');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-transparent rounded hover:border-btn-hover transition"
            >
              <span>Select Warehouse</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div id="warehouse-dropdown" className="hidden absolute left-1/2 -translate-x-1/2 mt-2 bg-primary border border-border_color rounded shadow-md z-10 w-[130px]">
              <ul className="py-1 text-sm text-textColor-primary text-left">
                <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Warehouse 1</a></li>
                <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Warehouse 2</a></li>
                <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Warehouse 3</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center">
          {/* ✅ Add Warehouse Button */}
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
            Add Warehouse
          </button>

          {/* Filter Button */}
          <div className="relative inline-block text-center">
            <button
              onClick={() => {
                const dropdown = document.getElementById('filter-dropdown');
                dropdown?.classList.toggle('hidden');
              }}
              className="bg-primary text-secondary rounded px-4 py-3 text-sm hover:text-textColor-secondary hover:bg-violet-600 w-[60px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="9" y1="18" x2="15" y2="18" />
              </svg>
            </button>

            <div
              id="filter-dropdown"
              className="hidden absolute left-1/2 -translate-x-1/2 mt-2 bg-primary border border-border_color rounded shadow-md z-10 w-[130px]"
            >
              <ul className="py-1 text-sm text-textColor-primary text-left">
                <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Received</a></li>
                <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Delivered</a></li>
                <li><a href="#" className="block px-4 py-2 hover:bg-btn-hover">Pending</a></li>
              </ul>
            </div>
          </div>

          {/* Cancel Button */}
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

      {/* ✅ Modal for Add Warehouse */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-primary text-textColor-primary rounded-md w-[400px] p-6 shadow-lg border border-border_color relative">
            <h2 className="text-xl font-semibold mb-4">Add New Warehouse</h2>

            <form>
              <label className="block mb-1">Warehouse Name</label>
              <input type="text" required className="w-full border border-border_color rounded px-3 py-2 mb-4 bg-primary text-textColor-primary placeholder:text-textColor-tertiary focus:outline-none focus:ring-2 focus:ring-btn-primary" />

              <label className="block mb-1">Location</label>
              <input type="text" required className="w-full border border-border_color rounded px-3 py-2 mb-4 bg-primary text-textColor-primary placeholder:text-textColor-tertiary focus:outline-none focus:ring-2 focus:ring-btn-primary" />

              <label className="block mb-1">Description (optional)</label>
              <textarea className="w-full border border-border_color rounded px-3 py-2 mb-4 bg-primary text-textColor-primary placeholder:text-textColor-tertiary focus:outline-none focus:ring-2 focus:ring-btn-primary"></textarea>

              <div className="text-sm text-textColor-tertiary mb-4">
                Requested By: <span className="font-medium text-textColor-primary">Inventory module</span><br />
                Requested Date: <span className="font-medium text-textColor-primary">Current Date</span>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-red text-white rounded hover:bg-red/80"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green text-white rounded hover:bg-green/80">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Continue with Table & Pagination UI */}
      {/* Warehouse Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="text-left text-sm font-medium">
              <th className="px-4 py-2 w-[120px]">SKU</th>
              <th className="px-4 py-2 w-[160px]">Name</th>
              <th className="px-4 py-2 w-[80px]">Qty</th>
              <th className="px-4 py-2 w-[140px]">Category</th>
              <th className="px-4 py-2 w-[160px]">Date Assigned</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 10).map((item, index) => (
              <tr
                key={index}
                className={`border-t border-border_color ${index === 9 ? 'border-b-0' : 'border-b border-border_color'}`}
              >
                <td className="py-3 px-4 w-[120px]">{item.items?.sku || ''}</td>
                <td className="py-3 px-4 w-[160px]">{item.items?.name || ''}</td>
                <td className="py-3 px-4 w-[80px]">{item.quantity ?? ''}</td>
                <td className="py-3 px-4 w-[140px]">{item.items?.category?.name || ''}</td>
                <td className="py-3 px-4 w-[160px]">{item.date_assigned || ''}</td>
              </tr>
            ))}

            {/* Fill in empty rows to always have 10 rows */}
            {[...Array(Math.max(0, 10 - items.length))].map((_, i) => (
              <tr
                key={`empty-${i}`}
                className={`border-t border-border_color ${items.length + i === 9 ? 'border-b-0' : 'border-b border-border_color'}`}
              >
                <td className="py-3 px-4">&nbsp;</td>
                <td className="py-3 px-4">&nbsp;</td>
                <td className="py-3 px-4">&nbsp;</td>
                <td className="py-3 px-4">&nbsp;</td>
                <td className="py-3 px-4">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination UI */}
      <div className="flex justify-between items-center border-t border-border_color pt-4 mt-4">
        <div>
          Showing <span className="font-medium">{(page - 1) * limit + 1}</span>-<span className="font-medium">{Math.min(page * limit, total)}</span> of <span className="font-medium">{total}</span> products
        </div>
        <nav className="flex items-center gap-1">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="px-2 py-1 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </a>
          )}
          {[...Array(totalPages)].map((_, i) => {
            const current = i + 1;
            if (current === 1 || current === totalPages || Math.abs(current - page) <= 1) {
              return (
                <a key={current}href={`?page=${current}`}className={`px-3 py-1.5 rounded-lg transition-colors duration-200 ${page === current ? "bg-[#8A00C4] font-medium text-white": "hover:bg-tbl-hover hover:text-[#8A00C4] text-textColor-primary"}`}>{current}</a>
              );
            } else if ((current === page - 2 && current !== 1) || (current === page + 2 && current !== totalPages)) {
              return <span key={`ellipsis-${current}`} className="px-2 py-1 ">...</span>;
            }
            return null;
          })}
          {page < totalPages && (
            <a href={`?page=${page + 1}`} className="px-2 py-1 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </a>
          )}
        </nav>
      </div>
    </div>
  );
}

