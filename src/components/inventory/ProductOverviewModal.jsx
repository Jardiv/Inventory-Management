import { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function ProductModal({ product, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState("stock");
  const [stockData, setStockData] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    min_quantity: 0,
    max_quantity: 0,
    unit_price: 0,
    categoryName: "",
  });

  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const tabsRef = useRef([]);
  const underlineRef = useRef(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        min_quantity: product.min_quantity || 0,
        max_quantity: product.max_quantity || 0,
        unit_price: product.unit_price || 0,
        categoryName: product.category?.name || "",
      });
      setIsEditing(false);
    }
  }, [product]);

  useEffect(() => {
    if (product?.id && activeTab === "stock") {
      setLoadingStock(true);
      fetch(`/api/products/${product.id}/stock`)
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

  useEffect(() => {
    const activeIndex = activeTab === "stock" ? 0 : 1;
    const currentTab = tabsRef.current[activeIndex];
    const underline = underlineRef.current;

    if (currentTab && underline) {
      underline.style.width = `${currentTab.offsetWidth}px`;
      underline.style.transform = `translateX(${currentTab.offsetLeft}px)`;
    }
  }, [activeTab]);

  if (!product) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("quantity") || name === "unit_price" ? Number(value) : value,
    }));
  }

  async function handleSave() {
    setLoadingSave(true);
    try {
      const { error } = await supabase
        .from("items")
        .update({
          name: formData.name,
          sku: formData.sku,
          min_quantity: formData.min_quantity,
          max_quantity: formData.max_quantity,
          unit_price: formData.unit_price,
        })
        .eq("id", product.id);

      if (error) throw error;

      setIsEditing(false);
      if (onUpdated) onUpdated();
      alert("Product updated successfully!");
    } catch (err) {
      alert("Error updating product: " + err.message);
    }
    setLoadingSave(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoadingDelete(true);
    try {
      const { error } = await supabase.from("items").delete().eq("id", product.id);
      if (error) throw error;

      alert("Product deleted successfully!");
      setLoadingDelete(false);
      onClose();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert("Error deleting product: " + err.message);
      setLoadingDelete(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-primary backdrop-blur-lg p-6 rounded-2xl shadow-lg max-w-3xl w-full relative animate-fadeIn">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-primary hover:text-red-400 text-xl"
          disabled={loadingSave || loadingDelete}
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-500 pb-2 text-textColor-primary">
          Product Overview
        </h2>

        {/* Product Details or Editable Form */}
        <div className="space-y-2">
          {isEditing ? (
            <>
              <label className="block">
                <strong>Item Name:</strong>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 rounded border border-gray-400 bg-white text-black"
                  disabled={loadingSave || loadingDelete}
                />
              </label>

              <label className="block">
                <strong>Item Code (SKU):</strong>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 rounded border border-gray-400 bg-white text-black"
                  disabled={loadingSave || loadingDelete}
                />
              </label>

              <label className="block">
                <strong>Category:</strong>
                <input
                  type="text"
                  name="categoryName"
                  value={formData.categoryName}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 rounded border border-gray-400 bg-white text-black"
                  disabled={loadingSave || loadingDelete}
                />
              </label>

              <label className="block">
                <strong>Min Quantity:</strong>
                <input
                  type="number"
                  name="min_quantity"
                  value={formData.min_quantity}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 rounded border border-gray-400 bg-white text-black"
                  min={0}
                  disabled={loadingSave || loadingDelete}
                />
              </label>

              <label className="block">
                <strong>Max Quantity:</strong>
                <input
                  type="number"
                  name="max_quantity"
                  value={formData.max_quantity}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 rounded border border-gray-400 bg-white text-black"
                  min={0}
                  disabled={loadingSave || loadingDelete}
                />
              </label>

              <label className="block">
                <strong>Unit Price:</strong>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 rounded border border-gray-400 bg-white text-black"
                  step="0.01"
                  min={0}
                  disabled={loadingSave || loadingDelete}
                />
              </label>

              <div className="mt-4 flex gap-4">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  disabled={loadingSave || loadingDelete}
                >
                  {loadingSave ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                  disabled={loadingSave || loadingDelete}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-textColor-primary"><strong>Item Name:</strong> {product.name}</p>
              <p className="text-textColor-primary"><strong>Item Code:</strong> {product.sku}</p>
              <p className="text-textColor-primary"><strong>Category:</strong> {product.category?.name || "—"}</p>
              <p className="text-textColor-primary"><strong>Min Quantity:</strong> {product.min_quantity}</p>
              <p className="text-textColor-primary"><strong>Max Quantity:</strong> {product.max_quantity}</p>
              <p className="text-textColor-primary"><strong>Unit Price:</strong> ₱{product.unit_price?.toFixed(2)}</p>
            </>
          )}
        </div>

        {/* Buttons: Edit and Delete */}
        <div className="mt-4 flex gap-4">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              disabled={loadingSave || loadingDelete}
            >
              Edit
            </button>
          )}

          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            disabled={loadingSave || loadingDelete}
          >
            {loadingDelete ? "Deleting..." : "Delete"}
          </button>
        </div>

        {/* Tabs with animated underline */}
        <div className="relative flex border-b border-gray-500 mt-6 select-none">
          <button
            ref={(el) => (tabsRef.current[0] = el)}
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-2 text-sm transition-colors duration-300 focus:outline-none ${
              activeTab === "stock" ? "font-bold text-primary" : "text-textColor-primary font-normal"
            }`}
            style={{ backgroundColor: "transparent" }}
          >
            Stock Information
          </button>
          <button
            ref={(el) => (tabsRef.current[1] = el)}
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm transition-colors duration-300 focus:outline-none ${
              activeTab === "history" ? "font-bold text-primary" : "text-textColor-primary font-normal"
            }`}
            style={{ backgroundColor: "transparent" }}
          >
            Purchase History
          </button>
          <span
            ref={underlineRef}
            className="absolute bottom-0 left-0 h-[2px] bg-primary transition-transform duration-300"
            style={{ width: 0 }}
          />
        </div>

        {/* Tab content container */}
        <div className="mt-4 flex gap-6">
          <div className="flex-grow border border-gray-500 p-4 rounded-lg bg-primary text-textColor-primary space-y-2">
            {/* Render both contents, hide by CSS */}
            <div style={{ display: activeTab === "stock" ? "block" : "none" }}>
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
            </div>

            <div style={{ display: activeTab === "history" ? "block" : "none" }}>
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
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
