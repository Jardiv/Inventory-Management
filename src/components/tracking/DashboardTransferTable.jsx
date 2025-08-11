import { useEffect, useState } from "react";

const DashboardTransferTable = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransfers = async () => {
            try {
                const res = await fetch(
                    `/api/tracking/transfers?page=1&limit=10`
                );
                const result = await res.json();

                if (res.ok) {
                    const formatted = result.data.map((t) => ({
                        id: t.id,
                        name: t.items?.name || "Unknown",
                        date: new Date(t.transfer_date).toLocaleDateString(),
                        from: t.from_warehouse?.name || "N/A",
                        to: t.to_warehouse?.name || "N/A",
                    }));

                    setTransfers(formatted);
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
    }, []);

  const emptyRows = Math.max(10 - transfers.length, 0);

  return (
    <div className="w-full h-full bg-primary rounded-md px-4 py-4 text-textColor-primary font-[Poppins] flex flex-col">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Transfers</h2>
        <a
          href="/tracking/Transfer_product"
          className="text-btn-primary text-sm hover:underline"
        >
          See All
        </a>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-4 text-center text-sm border-b border-border_color py-2 font-medium">
        <div>Item Name</div>
        <div>Date</div>
        <div>From</div>
        <div>To</div>
      </div>

      {/* Scrollable Table Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-border_color">
        {loading ? (
          Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="grid grid-cols-4 text-center text-sm py-3 font-normal animate-pulse"
            >
              {Array.from({ length: 4 }).map((__, colIdx) => (
                <div
                  key={`skeleton-cell-${idx}-${colIdx}`}
                  className="mx-auto h-4 bg-gray-700/50 rounded w-[70%]"
                />
              ))}
            </div>
          ))
        ) : (
          transfers.slice(0, 8).map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-4 text-center text-sm py-3 font-normal"
            >
              <div className="truncate px-2">{t.name}</div>
              <div>{t.date}</div>
              <div className="truncate px-1">{t.from}</div>
              <div className="truncate px-1">{t.to}</div>
            </div>
          ))
        )}
        {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="grid grid-cols-4 text-center text-sm py-3 font-normal opacity-30"
          >
            <div>&nbsp;</div>
            <div>&nbsp;</div>
            <div>&nbsp;</div>
            <div>&nbsp;</div>
          </div>
        ))} 
      </div>
    </div>
  );

};

export default DashboardTransferTable;
