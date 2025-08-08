import { useState } from "react";

export default function ProductDetailModal({ product, onClose }) {
  const [activeTab, setActiveTab] = useState("stock"); // "stock" or "purchase"

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 text-white p-6 rounded-md w-[700px] max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and back link */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Product Overview</h2>
          <button
            className="text-purple-500 hover:underline"
            onClick={onClose}
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Primary Details */}
          <div>
            <h3 className="font-semibold border-b border-gray-600 pb-1 mb-2">
              Primary Details
            </h3>
            <p><strong>Item Name:</strong> {product.name}</p>
            <p><strong>Item Code:</strong> {product.code}</p>

            <h3 className="font-semibold border-b border-gray-600 mt-4 pb-1 mb-2">
              Auto Re-order Status
            </h3>
            <p><strong>Status:</strong> {product.autoReorder ? "Yes" : "No"}</p>

            <h3 className="font-semibold border-b border-gray-600 mt-4 pb-1 mb-2">
              Description
            </h3>
            <p>{product.description}</p>
          </div>

          {/* Category & Quantity Details */}
          <div>
            <h3 className="font-semibold border-b border-gray-600 pb-1 mb-2">
              Category Details
            </h3>
            <p><strong>Category:</strong> {product.category}</p>

            <h3 className="font-semibold border-b border-gray-600 mt-4 pb-1 mb-2">
              Quantity Details
            </h3>
            <p><strong>Minimum Quantity:</strong> {product.minQuantity}</p>
            <p><strong>Maximum Quantity:</strong> {product.maxQuantity}</p>

            {/* Edit and Delete Buttons */}
            <div className="flex gap-2 mt-6">
              <button className="bg-gray-700 px-4 py-1 rounded hover:bg-gray-600">Edit</button>
              <button className="bg-gray-700 px-4 py-1 rounded hover:bg-gray-600">Delete</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-600 pt-4">
          <nav className="flex space-x-4 text-sm font-medium text-gray-400">
            <button
              onClick={() => setActiveTab("stock")}
              className={`pb-2 border-b-2 ${
                activeTab === "stock"
                  ? "border-purple-500 text-white"
                  : "border-transparent"
              }`}
            >
              Stock Information
            </button>
            <button
              onClick={() => setActiveTab("purchase")}
              className={`pb-2 border-b-2 ${
                activeTab === "purchase"
                  ? "border-purple-500 text-white"
                  : "border-transparent"
              }`}
            >
              Purchase History
            </button>
          </nav>

          {/* Tab Content */}
          <div className="mt-4 max-h-64 overflow-auto text-sm bg-gray-800 p-4 rounded">
            {activeTab === "stock" && (
              <StockInfoTable stockData={product.stockInfo} />
            )}
            {activeTab === "purchase" && (
              <PurchaseHistoryTable purchaseData={product.purchaseHistory} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StockInfoTable({ stockData }) {
  if (!stockData || stockData.length === 0)
    return <p>No stock information available.</p>;

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr>
          <th className="border-b border-gray-600 px-2 py-1">Date</th>
          <th className="border-b border-gray-600 px-2 py-1">Quantity</th>
          <th className="border-b border-gray-600 px-2 py-1">Location</th>
        </tr>
      </thead>
      <tbody>
        {stockData.map((row, i) => (
          <tr key={i} className="odd:bg-gray-700 even:bg-gray-600">
            <td className="px-2 py-1">{new Date(row.date).toLocaleDateString()}</td>
            <td className="px-2 py-1">{row.quantity}</td>
            <td className="px-2 py-1">{row.location}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PurchaseHistoryTable({ purchaseData }) {
  if (!purchaseData || purchaseData.length === 0)
    return <p>No purchase history available.</p>;

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr>
          <th className="border-b border-gray-600 px-2 py-1">Date</th>
          <th className="border-b border-gray-600 px-2 py-1">Supplier</th>
          <th className="border-b border-gray-600 px-2 py-1">Quantity</th>
          <th className="border-b border-gray-600 px-2 py-1">Price</th>
        </tr>
      </thead>
      <tbody>
        {purchaseData.map((row, i) => (
          <tr key={i} className="odd:bg-gray-700 even:bg-gray-600">
            <td className="px-2 py-1">{new Date(row.date).toLocaleDateString()}</td>
            <td className="px-2 py-1">{row.supplier}</td>
            <td className="px-2 py-1">{row.quantity}</td>
            <td className="px-2 py-1">₱{row.price.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
