import { useState, useEffect } from "react";

export default function ProductModal({ product, onClose }) {
  const [activeTab, setActiveTab] = useState("stock");
  const [stockData, setStockData] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    if (product?.id && activeTab === "stock") {
      setLoadingStock(true);
      fetch(`/api/products/${product.id}/stock`) // Adjust API route to match your backend
        .then((res) => res.json())
        .then((data) => {
          setStockData(data);
          setLoadingStock(false);
        })
        .catch(() => {
          setStockData([]);
          setLoadingStock(false);
        });
    }
  }, [product?.id, activeTab]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-primary backdrop-blur-lg p-6 rounded-2xl shadow-lg max-w-3xl w-full relative animate-fadeIn">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-primary hover:text-red-400 text-xl"
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-500 pb-2 text-textColor-primary">
          Product Overview
        </h2>

        {/* Product Details */}
        <div className="space-y-2">
          <p className="text-textColor-primary"><strong>Item Name:</strong> {product.name}</p>
          <p className="text-textColor-primary"><strong>Item Code:</strong> {product.sku}</p>
          <p className="text-textColor-primary"><strong>Category:</strong> {product.category?.name || "—"}</p>
          <p className="text-textColor-primary"><strong>Min Quantity:</strong> {product.min_quantity}</p>
          <p className="text-textColor-primary"><strong>Max Quantity:</strong> {product.max_quantity}</p>
          <p className="text-textColor-primary"><strong>Unit Price:</strong> ₱{product.unit_price?.toFixed(2)}</p>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-4 border-b border-gray-500 pb-2">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "stock"
                ? "bg-violet-500/40 text-primary"
                : "bg-violet-500/20 hover:bg-violet-500/40 text-textColor-primary"
            }`}
          >
            Stock Information
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "history"
                ? "bg-violet-500/40 text-primary"
                : "bg-violet-500/20 hover:bg-violet-500/40 text-textColor-primary"
            }`}
          >
            Purchase History
          </button>
        </div>

        {/* Table Placeholder */}
        <div className="mt-4 border border-gray-500 p-4 rounded-lg bg-primary text-textColor-primary space-y-2">
          {activeTab === "stock" && (
            <>
              <div className="grid grid-cols-3 font-semibold border-b border-gray-500 pb-2">
                <span>Warehouse</span>
                <span>Quantity</span>
                <span>Status</span>
              </div>

              {loadingStock ? (
                <p>Loading stock data...</p>
              ) : stockData.length > 0 ? (
                stockData.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3">
                    <span>{item.warehouse_name}</span>
                    <span>{item.quantity}</span>
                    <span>
                      {item.quantity > product.min_quantity
                        ? "In Stock"
                        : item.quantity > 0
                        ? "Low Stock"
                        : "Out of Stock"}
                    </span>
                  </div>
                ))
              ) : (
                <p>No stock data available</p>
              )}
            </>
          )}

          {activeTab === "history" && (
            <>
              <div className="grid grid-cols-4 font-semibold border-b border-gray-500 pb-2">
                <span>Date</span>
                <span>Supplier</span>
                <span>Quantity</span>
                <span>Total Cost</span>
              </div>
              <div className="grid grid-cols-4">
                <span>2025-08-01</span>
                <span>ABC Supplies</span>
                <span>100</span>
                <span>₱5,000</span>
              </div>
              <div className="grid grid-cols-4">
                <span>2025-07-20</span>
                <span>XYZ Trading</span>
                <span>50</span>
                <span>₱2,500</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
