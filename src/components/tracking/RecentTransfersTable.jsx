import React from "react";

const RecentTransfersTable = ({ recentTransfers = [], loading = false }) => {
  return (
    <div className="w-1/2 bg-primary rounded-md p-6 text-textColor-primary font-poppins">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Recent Transfers</h2>
        </div>
        <a
          href="/tracking/Transfer_product"
          className="text-btn-primary text-sm hover:underline"
        >
          See All
        </a>
      </div>

      {/* Table */}
      <div>
        <div className="grid grid-cols-5 text-sm font-semibold border-b border-border_color pb-2 mb-4 text-left">
          <span>Transfer ID</span>
          <span>Name</span>
          <span>Qty.</span>
          <span>From</span>
          <span>To</span>
        </div>

        <div className="space-y-2 text-sm">
          {loading || recentTransfers.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="grid grid-cols-5 items-center border-b border-border_color py-2 animate-pulse"
                >
                  <span className="mx-auto w-10 h-4 bg-gray-700 rounded"></span>
                  <span className="mx-auto w-16 h-4 bg-gray-700 rounded"></span>
                  <span className="mx-auto w-8 h-4 bg-gray-700 rounded"></span>
                  <span className="mx-auto w-14 h-4 bg-gray-700 rounded"></span>
                  <span className="mx-auto w-14 h-4 bg-gray-700 rounded"></span>
                </div>
              ))
            : recentTransfers.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-5 items-center border-b border-border_color py-2"
                >
                  <span>{t.id}</span>
                  <span>{t.items?.name || "Unknown"}</span>
                  <span>{t.quantity}</span>
                  <span>{t.from_warehouse?.name || "N/A"}</span>
                  <span>{t.to_warehouse?.name || "N/A"}</span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default RecentTransfersTable;