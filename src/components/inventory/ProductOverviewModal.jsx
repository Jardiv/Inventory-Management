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
        description: "",
    });

    const [supplierName, setSupplierName] = useState("—");
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    const tabsRef = useRef([]);
    const underlineRef = useRef(null);

    // ✅ Fetch only needed product data for modal
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
    }, [product]);

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
        if (!confirm("Are you sure you want to delete this product?")) return;

        setLoadingDelete(true);
        try {
            const { error } = await supabase
                .from("items")
                .delete()
                .eq("id", product.id);
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
                    className="absolute px-2 py-1 rounded-md top-3 right-3 text-xl text-textColor-primary hover:bg-btn-hover hover:text-textColor-secondary"
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
                        <p><strong>Item Name:</strong> {formData.name}</p>
                        <p><strong>Item Code:</strong> {formData.sku}</p>
                        <p><strong>Category:</strong> {formData.categoryName || "—"}</p>
                        <p><strong>Min Quantity:</strong> {formData.min_quantity}</p>
                        <p><strong>Max Quantity:</strong> {formData.max_quantity}</p>
                        <p><strong>Unit Price:</strong> ₱{formData.unit_price?.toFixed(2)}</p>
                        <p><strong>Supplier:</strong> {supplierName}</p>
                        <p><strong>Description:</strong> {formData.description || "No description provided"}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="sku" value={formData.sku} onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="min_quantity" type="number" value={formData.min_quantity} onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="max_quantity" type="number" value={formData.max_quantity} onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="unit_price" type="number" value={formData.unit_price} onChange={handleChange} className="w-full p-2 border rounded" />
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Enter product description" />
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
                            color: activeTab === "stock"
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
                            color: activeTab === "purchase"
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
                        {activeTab === "stock" && (
                            <>
                                <div className="grid grid-cols-4 font-semibold border-b pb-2" style={{ borderColor: "var(--color-border_color)" }}>
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
                                            <span>{formData.min_quantity}</span>
                                            <span>{formData.max_quantity}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>No stock data available</p>
                                )}
                            </>
                        )}

                        {/* Purchase History Tab */}
                        {activeTab === "purchase" && (
                            <>
                                <div className="grid grid-cols-4 font-semibold border-b pb-2" style={{ borderColor: "var(--color-border_color)" }}>
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
                                disabled={loadingDelete}
                                className="px-4 py-2 rounded transition-colors duration-200"
                                style={{
                                    backgroundColor: "var(--color-red)",
                                    color: "var(--color-textColor-secondary)",
                                    opacity: loadingDelete ? 0.6 : 1,
                                    cursor: loadingDelete ? "not-allowed" : "pointer",
                                }}
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
