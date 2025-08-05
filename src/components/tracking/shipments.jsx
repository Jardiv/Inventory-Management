import React, { useEffect, useState } from 'react';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch('/api/tracking/shipments');
        const data = await res.json();

        if (res.ok) {
          setShipments(data);
        } else {
          console.error('Error fetching shipments:', data.error);
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

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
            <span>Receive Items</span>
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
          <div className="grid grid-cols-5 text-center text-lg border-b border-border_color py-2 font-medium">
            <div className="min-w-[150px]">Shipment ID</div>
            <div className="min-w-[200px]">Warehouse</div>
            <div className="min-w-[150px]">Item name</div>
            <div className="min-w-[200px]">Quantity</div>
            <div className="min-w-[150px]">Status</div>
          </div>
          <div className="divide-y divide-border_color">
            {shipments.map((t, i) => (
              <div key={i} className="grid grid-cols-5 text-center text-lg py-4 font-normal">
                <div>{t.id}</div>
                <div>{t.warehouse}</div>
                <div>{t.name}</div>
                <div>{t.qty}</div>
                <div>{t.status}</div>
              </div>
            ))}
            {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 text-center text-lg h-[56px] font-normal opacity-50">
                <div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div>
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
          <div className="bg-primary border border-border_color rounded-lg shadow-lg w-[711px] h-[800px] p-6 relative flex flex-col">
            <h2 className="text-2xl font-semibold mb-6">Receive Items</h2>

            {/* Scrollable form body (omit for now or implement from original) */}
            <div className="flex-1 overflow-auto mb-4">
              <p className="text-lg text-center text-textColor-secondary">Modal content goes here</p>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-border_color">
              <p className="text-center text-lg mb-4">Warehouse Capacity: 0/100</p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowModal(false)} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">Cancel</button>
                <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">OK</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipments;
