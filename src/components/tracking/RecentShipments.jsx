import React, { useEffect, useState } from 'react';

const RecentShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ Added loading state

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch('/api/tracking/shipments');
        const data = await res.json();

        if (res.ok) {
          setShipments(data.slice(0, 4));
        } else {
          console.error('Error fetching shipments:', data.error);
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      } finally {
        setLoading(false); // ✅ Done loading
      }
    };

    fetchShipments();
  }, []);

  // If not loading, fill with empty rows for consistent height
  const emptyRows = !loading ? 4 - shipments.length : 0;

  return (
    <div className="space-y-2 text-sm">
      {loading
        ? // ✅ Skeleton rows when loading
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="grid grid-cols-4 items-center border-b border-border_color py-2 animate-pulse"
            >
              <span className="mx-auto w-10 h-4 bg-gray-700 rounded"></span>
              <span className="mx-auto w-16 h-4 bg-gray-700 rounded"></span>
              <span className="mx-auto w-8 h-4 bg-gray-700 rounded"></span>
              <span className="mx-auto w-14 h-4 bg-gray-700 rounded"></span>
            </div>
          ))
        : // ✅ Actual data when loaded
          shipments.map((shipment, idx) => (
            <div
              key={idx}
              className="grid grid-cols-4 items-center border-b border-border_color py-2"
            >
              <span>{shipment.id}</span>
              <span>{shipment.name}</span>
              <span>{shipment.qty}</span>
              <span
                className={
                  shipment.status === 'RECEIVED'
                    ? 'text-green-500 font-semibold'
                    : shipment.status === 'PENDING'
                    ? 'text-yellow-500 font-semibold'
                    : 'font-semibold'
                }
              >
                {shipment.status.toUpperCase()}
              </span>
            </div>
          ))}

      {/* Fill up empty space if less than 4 rows */}
      {!loading &&
        Array.from({ length: emptyRows }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="grid grid-cols-4 items-center border-b border-border_color py-2 text-transparent"
          >
            <span>-</span>
            <span>-</span>
            <span>-</span>
            <span>-</span>
          </div>
        ))}
    </div>
  );
};

export default RecentShipments;
