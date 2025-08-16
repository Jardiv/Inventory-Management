import { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
    description: "",
  });

  const [supplierName, setSupplierName] = useState("—");
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const tabsRef = useRef([]);
  const underlineRef = useRef(null);

  // 📌 Export as PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    const tableColumn = ["Warehouse Name", "Current Stock", "Min Stock", "Max Stock"];
    const tableRows = stockData.map(item => [
      item.warehouse_name,
      item.quantity.toString(),
      formData.min_quantity.toString(),
      formData.max_quantity.toString()
    ]);

    doc.text("Product Inventory Report", 14, 15);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`${formData.name}_inventory_report.pdf`);
  };

  // 📌 Export as CSV
  const exportCSV = () => {
    const headers = ["Warehouse Name", "Current Stock", "Min Stock", "Max Stock"];
    const rows = stockData.map(item =>
      [item.warehouse_name, item.quantity, formData.min_quantity, formData.max_quantity].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${formData.name}_inventory_report.csv`;
    link.click();
  };

  // 🔹 Fetch stock information for the product
  const fetchStockData = async () => {
    if (!product?.id) return;

    setLoadingStock(true);
    try {
      const { data, error } = await supabase
        .from("warehouse_items")
        .select(`
          quantity,
          warehouse_id,
          warehouse (
            id,
            name,
            location
          )
        `)
        .eq("item_id", product.id);

      if (error) {
        console.error("Error fetching stock data:", error);
        setStockData([]);
      } else {
        console.log("Stock data received:", data);
        
        // Transform the data for display
        const transformedData = data.map(item => ({
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouse?.name || 'Unknown Warehouse',
          warehouse_location: item.warehouse?.location || 'Unknown Location',
          quantity: item.quantity || 0
        }));

        setStockData(transformedData);
      }
    } catch (err) {
      console.error("Error in fetchStockData:", err);
      setStockData([]);
    }
    setLoadingStock(false);
  };

  // 🔹 Fetch purchase history for the product
  const fetchPurchaseHistory = async () => {
    if (!product?.id) return;

    setLoadingPurchase(true);
    try {
      const { data, error } = await supabase
        .from("purchase_orders_items")
        .select(`
          quantity,
          purchase_orders (
            date_created,
            total_price
          ),
          suppliers (
            name
          )
        `)
        .eq("item_id", product.id)
        .order("purchase_orders.date_created", { ascending: false });

      if (error) {
        console.error("Error fetching purchase history:", error);
        setPurchaseHistory([]);
      } else {
        console.log("Purchase history received:", data);
        
        // Transform the data for display
        const transformedHistory = data.map((item, index) => ({
          id: index,
          date: item.purchase_orders?.date_created 
            ? new Date(item.purchase_orders.date_created).toLocaleDateString()
            : 'Unknown Date',
          supplier: item.suppliers?.name || 'Unknown Supplier',
          quantity: item.quantity || 0,
          price: item.purchase_orders?.total_price 
            ? `₱${item.purchase_orders.total_price.toLocaleString()}`
            : 'N/A'
        }));

        setPurchaseHistory(transformedHistory);
      }
    } catch (err) {
      console.error("Error in fetchPurchaseHistory:", err);
      setPurchaseHistory([]);
    }
    setLoadingPurchase(false);
  };

  // Fetch product details
  useEffect(() => {
    if (!product?.id) return;

    const fetchProductDetails = async () => {
      const { data, error } = await supabase
        .from("items")
        .select(`
          id,
          name,
          sku,
          min_quantity,
          max_quantity,
          unit_price,
          description,
          category:category_id(name),
          suppliers:curr_supplier_id(name)
        `)
        .eq("id", product.id)
        .single();

      if (error) {
        console.error("Error fetching product details:", error);
        return;
      }

      setFormData({
        name: data.name || "",
        sku: data.sku || "",
        min_quantity: data.min_quantity || 0,
        max_quantity: data.max_quantity || 0,
        unit_price: data.unit_price || 0,
        categoryName: data.category?.name || "",
        description: data.description || "",
      });

      setSupplierName(data.suppliers?.name || "—");
    };

    fetchProductDetails();
    fetchStockData();
    fetchPurchaseHistory();
  }, [product]);

  // 🔹 Refetch data when switching tabs
  useEffect(() => {
    if (!product?.id) return;
    
    if (activeTab === "stock") {
      fetchStockData();
    } else if (activeTab === "purchase") {
      fetchPurchaseHistory();
    }
  }, [activeTab, product]);

  // Animate underline for tabs
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
      [name]:
        name.includes("quantity") || name === "unit_price"
          ? Number(value)
          : value,
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
          description: formData.description,
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
    if (!product?.id) {
      alert("No product selected to delete.");
      return;
    }

    // Check if product is out of stock before allowing deletion
    if (totalStock > 0) {
      alert(
        `Cannot delete "${formData.name}" because it still has ${totalStock} items in stock. Products can only be deleted when they are out of stock.`
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${formData.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setLoadingDelete(true);
    try {
      const { error } = await supabase
        .from("items")
        .update({ isDeleted: true }) // Soft delete
        .eq("id", product.id);

      if (error) throw error;

      alert(`"${formData.name}" marked as deleted successfully!`);
      setLoadingDelete(false);

      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      alert("Error deleting product: " + err.message);
      setLoadingDelete(false);
    }
  }

  // Calculate total stock across all warehouses
  const totalStock = stockData.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  // Determine stock status
  const getStockStatus = () => {
    if (totalStock === 0) return { status: "Out of Stock", color: "var(--color-red)" };
    if (totalStock < formData.min_quantity) return { status: "Low Stock", color: "var(--color-orange)" };
    if (totalStock > formData.max_quantity) return { status: "Overstocked", color: "var(--color-blue)" };
    return { status: "Normal", color: "var(--color-green)" };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="backdrop-blur-lg p-6 rounded-2xl shadow-lg max-w-4xl w-full relative animate-fadeIn max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--color-primary)" }}
      >

        {/* Export Dropdown */}
        <div className="absolute top-3 right-12">
          <div className="group relative inline-block">
            <button
              className="p-2 text-textColor-primary hover:bg-btn-hover hover:text-white rounded"
              disabled={loadingSave || loadingDelete}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                className="w-5 h-5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </button>
            {/* Dropdown Menu */}
            <div className="absolute hidden group-hover:block right-0 mt-1 w-40 bg-white border rounded shadow-lg z-50">
              <button
                onClick={exportCSV}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
              >
                Export CSV
              </button>
              <button
                onClick={exportPDF}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 px-2 py-1 rounded-md text-xl text-textColor-primary hover:bg-btn-hover hover:text-textColor-secondary"
          disabled={loadingSave || loadingDelete}
        >
          ✖
        </button>

        {/* Title */}
        <div>
          <h2
            className="text-2xl font-semibold mb-4 border-b pb-2"
            style={{
              borderColor: "var(--color-border_color)",
              color: "var(--color-textColor-primary)",
            }}
          >
            Product Overview
          </h2>
        </div>

        {/* Product Details */}
        {!isEditing ? (
          <div
            className="space-y-2"
            style={{ color: "var(--color-textColor-primary)" }}
          >
            <p>
              <strong>Item Name:</strong> {formData.name}
            </p>
            <p>
              <strong>Item Code:</strong> {formData.sku}
            </p>
            <p>
              <strong>Category:</strong> {formData.categoryName || "—"}
            </p>
            <p>
              <strong>Status:</strong> <span style={{ color: stockStatus.color, fontWeight: "bold" }}>{stockStatus.status}</span>
            </p>
            <p>
              <strong>Unit Price:</strong> ₱{formData.unit_price?.toFixed(2)}
            </p>
            <p>
              <strong>Supplier:</strong> {supplierName}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {formData.description || "No description provided"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Item Name"
              className="w-full p-2 border rounded"
            />
            <input
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Item Code"
              className="w-full p-2 border rounded"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="min_quantity"
                type="number"
                value={formData.min_quantity}
                onChange={handleChange}
                placeholder="Min Quantity"
                className="w-full p-2 border rounded"
              />
              <input
                name="max_quantity"
                type="number"
                value={formData.max_quantity}
                onChange={handleChange}
                placeholder="Max Quantity"
                className="w-full p-2 border rounded"
              />
            </div>
            <input
              name="unit_price"
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={handleChange}
              placeholder="Unit Price"
              className="w-full p-2 border rounded"
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Enter product description"
              rows="3"
            />
          </div>
        )}

        {/* Tabs */}
        <div
          className="relative flex border-b select-none mt-6"
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
        <div className="mt-4">
          <div
            className="border p-4 rounded-lg"
            style={{
              borderColor: "var(--color-border_color)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-textColor-primary)",
            }}
          >
            {/* Stock Tab */}
            {activeTab === "stock" && (
              <>
                <div
                  className="grid grid-cols-4 font-semibold border-b pb-2 mb-3"
                  style={{ borderColor: "var(--color-border_color)" }}
                >
                  <span>Warehouse Name</span>
                  <span>Current Stock</span>
                  <span>Min Stock</span>
                  <span>Max Stock</span>
                </div>
                {loadingStock ? (
                  <div className="text-center py-4">
                    <p>Loading stock data...</p>
                  </div>
                ) : stockData.length > 0 ? (
                  <div className="space-y-2">
                    {stockData.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-4 py-2 hover:bg-gray-50/10 rounded">
                        <span>{item.warehouse_name}</span>
                        <span className="font-semibold">{item.quantity}</span>
                        <span>{formData.min_quantity}</span>
                        <span>{formData.max_quantity}</span>
                      </div>
                    ))}
                    <div 
                      className="grid grid-cols-4 py-2 mt-3 pt-3 font-bold border-t"
                      style={{ borderColor: "var(--color-border_color)" }}
                    >
                      <span>Total Stock:</span>
                      <span style={{ color: stockStatus.color }}>{totalStock}</span>
                      <span>-</span>
                      <span>-</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No stock data available</p>
                  </div>
                )}
              </>
            )}

            {/* Purchase History Tab */}
            {activeTab === "purchase" && (
              <>
                <div
                  className="grid grid-cols-4 font-semibold border-b pb-2 mb-3"
                  style={{ borderColor: "var(--color-border_color)" }}
                >
                  <span>Date</span>
                  <span>Supplier</span>
                  <span>Quantity</span>
                  <span>Total Cost</span>
                </div>
                {loadingPurchase ? (
                  <div className="text-center py-4">
                    <p>Loading purchase history...</p>
                  </div>
                ) : purchaseHistory.length > 0 ? (
                  <div className="space-y-2">
                    {purchaseHistory.map((purchase) => (
                      <div key={purchase.id} className="grid grid-cols-4 py-2 hover:bg-gray-50/10 rounded">
                        <span>{purchase.date}</span>
                        <span>{purchase.supplier}</span>
                        <span>{purchase.quantity}</span>
                        <span>{purchase.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No purchase history available</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={handleDelete}
                disabled={loadingDelete || totalStock > 0}
                className="px-4 py-2 rounded transition-colors duration-200"
                style={{
                  backgroundColor: totalStock > 0 ? "var(--color-textColor-tertiary)" : "var(--color-red)",
                  color: "var(--color-textColor-secondary)",
                  opacity: (loadingDelete || totalStock > 0) ? 0.6 : 1,
                  cursor: (loadingDelete || totalStock > 0) ? "not-allowed" : "pointer",
                }}
                title={totalStock > 0 ? `Cannot delete: ${totalStock} items still in stock` : "Delete product"}
              >
                {loadingDelete ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-7 py-2 rounded transition-colors duration-200"
                style={{
                  backgroundColor: "var(--color-btn-primary)",
                  color: "var(--color-textColor-secondary)",
                }}
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data to original product data
                  setFormData({
                    name: product.name || "",
                    sku: product.sku || "",
                    min_quantity: product.min_quantity || 0,
                    max_quantity: product.max_quantity || 0,
                    unit_price: product.unit_price || 0,
                    categoryName: product.category?.name || "",
                    description: product.description || "",
                  });
                }}
                className="px-4 py-2 rounded transition-colors duration-200"
                style={{
                  backgroundColor: "var(--color-red)",
                  color: "var(--color-textColor-secondary)",
                }}
              >
                Cancel
              </button>
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
              >
                {loadingSave ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}