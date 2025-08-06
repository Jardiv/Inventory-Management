import React, { useEffect, useState } from 'react';

const RecentShipments = () => {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch('/api/tracking/shipments');
        const data = await res.json();

        if (res.ok) {
          // Limit to 4 rows max
          setShipments(data.slice(0, 4));
        } else {
          console.error('Error fetching shipments:', data.error);
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      }
    };

    fetchShipments();
  }, []);

  // Add blank rows if less than 4
  const emptyRows = 4 - shipments.length;

  return (
    <div className="space-y-2 text-sm">
      {shipments.map((shipment, idx) => (
        <div key={idx} className="grid grid-cols-4 items-center border-b border-border_color py-2">
          <span>{shipment.id}</span>
          <span>{shipment.name}</span>
          <span>{shipment.qty}</span>
          <span className={
            shipment.status === 'RECEIVED' ? 'text-green-500 font-semibold'
            : shipment.status === 'PENDING' ? 'text-yellow-500 font-semibold'
            : 'font-semibold'
          }>
            {shipment.status.toUpperCase()}
          </span>
        </div>
      ))}

      {/* Fill up empty space with blank rows for UI consistency */}
      {Array.from({ length: emptyRows }).map((_, i) => (
        <div key={`empty-${i}`} className="grid grid-cols-4 items-center border-b border-border_color py-2 text-transparent">
          <span>-</span><span>-</span><span>-</span><span>-</span>
        </div>
      ))}
    </div>
  );
};

export default RecentShipments;
