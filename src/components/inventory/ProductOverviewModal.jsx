import { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function ProductModal({ product, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState("stock");
  const [stockData, setStockData] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);

  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loadingPurchase, setLoadingPurchase] = useState(true);

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

  // Fetch stock data
  useEffect(() => {
    if (product?.id && activeTab === "stock") {
      setLoadingStock(true);
      supabase
        .from("stock")
        .select("id, warehouse_name, quantity")
        .eq("product_id", product.id)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching stock data:", error);
            setStockData([]);
          } else {
            setStockData(data || []);
          }
          setLoadingStock(false);
        });
    }
  }, [product?.id, activeTab]);

  // Fetch purchase history
  useEffect(() => {
    if (product?.id && activeTab === "purchase") {
      setLoadingPurchase(true);
      supabase
        .from("purchase_history")
        .select("id, date, supplier, quantity, price")
        .eq("product_id", product.id)
        .order("date", { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching purchase history:", error);
            setPurchaseHistory([]);
          } else {
            setPurchaseHistory(data || []);
          }
          setLoadingPurchase(false);
        });
    }
  }, [product?.id, activeTab]);

  // Animate underline
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
      <div
        className="backdrop-blur-lg p-6 rounded-2xl shadow-lg max-w-3xl w-full relative animate-fadeIn"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl"
          style={{ color: "var(--color-primary)" }}
          disabled={loadingSave || loadingDelete}
        >
          ✖
        </button>

        {/* Title */}
        <h2
          className="text-2xl font-semibold mb-4 border-b pb-2"
          style={{
            borderColor: "var(--color-border_color)",
            color: "var(--color-textColor-primary)",
          }}
        >
          Product Overview
        </h2>

        {/* Product Details */}
        {!isEditing ? (
          <div className="space-y-2" style={{ color: "var(--color-textColor-primary)" }}>
            <p><strong>Item Name:</strong> {product.name}</p>
            <p><strong>Item Code:</strong> {product.sku}</p>
            <p><strong>Category:</strong> {product.category?.name || "—"}</p>
            <p><strong>Min Quantity:</strong> {product.min_quantity}</p>
            <p><strong>Max Quantity:</strong> {product.max_quantity}</p>
            <p><strong>Unit Price:</strong> ₱{product.unit_price?.toFixed(2)}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="sku" value={formData.sku} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="min_quantity" type="number" value={formData.min_quantity} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="max_quantity" type="number" value={formData.max_quantity} onChange={handleChange} className="w-full p-2 border rounded" />
            <input name="unit_price" type="number" value={formData.unit_price} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
        )}

        {/* Tabs */}
        <div
          className="relative flex border-b select-none mt-4"
          style={{ borderColor: "var(--color-border_color)" }}
        >
          <button
            ref={(el) => (tabsRef.current[0] = el)}
            onClick={() => setActiveTab("stock")}
            className="px-4 py-2 text-sm transition-colors duration-300 focus:outline-none"
            style={{
              fontWeight: activeTab === "stock" ? "bold" : "normal",
              color:
                activeTab === "stock"
                  ? "var(--color-btn-primary)"
                  : "var(--color-textColor-primary)",
            }}
          >
            Stock Information
          </button>
          <button
            ref={(el) => (tabsRef.current[1] = el)}
            onClick={() => setActiveTab("purchase")}
            className="px-4 py-2 text-sm transition-colors duration-300 focus:outline-none"
            style={{
              fontWeight: activeTab === "purchase" ? "bold" : "normal",
              color:
                activeTab === "purchase"
                  ? "var(--color-btn-primary)"
                  : "var(--color-textColor-primary)",
            }}
          >
            Purchase History
          </button>
          <span
            ref={underlineRef}
            className="absolute bottom-0 left-0 h-[2px] transition-transform duration-300"
            style={{
              width: 0,
              backgroundColor: "var(--color-purple)",
            }}
          />
        </div>

        {/* Content */}
        <div className="mt-4 flex gap-6">
          <div
            className="flex-grow border p-4 rounded-lg space-y-2"
            style={{
              borderColor: "var(--color-border_color)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-textColor-primary)",
            }}
          >
            {/* Stock Tab */}
            <div
              style={{
                visibility: activeTab === "stock" ? "visible" : "hidden",
                height: activeTab === "stock" ? "auto" : 0,
                overflow: "hidden",
              }}
            >
              <div
                className="grid grid-cols-4 font-semibold border-b pb-2"
                style={{ borderColor: "var(--color-border_color)" }}
              >
                <span>Warehouse Name</span>
                <span>Current Stock</span>
                <span>Min Stock</span>
                <span>Max Stock</span>
              </div>
              {loadingStock ? (
                <p>Loading stock data...</p>
              ) : stockData.length > 0 ? (
                stockData.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-4">
                    <span>{item.warehouse_name}</span>
                    <span>{item.quantity}</span>
                    <span>{product.min_quantity}</span>
                    <span>{product.max_quantity}</span>
                  </div>
                ))
              ) : (
                <p>No stock data available</p>
              )}
            </div>

            {/* Purchase History Tab */}
            <div
              style={{
                visibility: activeTab === "purchase" ? "visible" : "hidden",
                height: activeTab === "purchase" ? "auto" : 0,
                overflow: "hidden",
              }}
            >
              <div
                className="grid grid-cols-4 font-semibold border-b pb-2"
                style={{ borderColor: "var(--color-border_color)" }}
              >
                <span>Date</span>
                <span>Supplier</span>
                <span>Quantity</span>
                <span>Total Cost</span>
              </div>
              {loadingPurchase ? (
                <p>Loading purchase history...</p>
              ) : purchaseHistory.length > 0 ? (
                purchaseHistory.map((purchase) => (
                  <div key={purchase.id} className="grid grid-cols-4">
                    <span>{purchase.date}</span>
                    <span>{purchase.supplier}</span>
                    <span>{purchase.quantity}</span>
                    <span>{purchase.price}</span>
                  </div>
                ))
              ) : (
                <p>No purchase history available</p>
              )}
            </div>
          </div>
        </div>


        {/* Action Buttons */}
<div className="mt-6 flex justify-end gap-3">
  {!isEditing ? (
    <button
      onClick={() => setIsEditing(true)}
      className="px-7 py-2 rounded transition-colors duration-200"
      style={{
        backgroundColor: "var(--color-btn-primary)",
        color: "var(--color-textColor-secondary)",
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = "var(--color-btn-hover)"}
      onMouseLeave={(e) => e.target.style.backgroundColor = "var(--color-btn-primary)"}
    >
      Edit
    </button>
  ) : (
    <button
      onClick={handleSave}
      disabled={loadingSave}
      className="px-4 py-2 rounded transition-colors duration-200"
      style={{
        backgroundColor: "var(--color-btn-primary)",
        color: "var(--color-textColor-secondary)",
        opacity: loadingSave ? 0.6 : 1,
        cursor: loadingSave ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!loadingSave) e.target.style.backgroundColor = "var(--color-btn-hover)";
      }}
      onMouseLeave={(e) => {
        if (!loadingSave) e.target.style.backgroundColor = "var(--color-btn-primary)";
      }}
    >
      {loadingSave ? "Saving..." : "Save"}
    </button>
  )}

  <button
  onClick={handleDelete}
  disabled={loadingDelete}
  className="px-4 py-2 rounded transition-colors duration-200"
  style={{
    backgroundColor: "var(--color-red)",
    color: "var(--color-textColor-secondary)",
    opacity: loadingDelete ? 0.6 : 1,
    cursor: loadingDelete ? "not-allowed" : "pointer",
  }}
  onMouseEnter={(e) => {
    if (!loadingDelete) e.target.style.backgroundColor = "#b71c1c"; 
  }}
  onMouseLeave={(e) => {
    if (!loadingDelete) e.target.style.backgroundColor = "var(--color-red)";
  }}
>
  {loadingDelete ? "Deleting..." : "Delete"}
</button>

</div>

        </div>
      </div>

  );
}
