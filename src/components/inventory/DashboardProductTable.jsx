import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import ProductOverviewModal from "./ProductOverviewModal.jsx";

const getStatusStyle = (status) => {
  switch (status) {
    case "Normal":
      return "text-green bg-green/10";
    case "Low Stock":
      return "text-orange bg-orange/10";
    case "Out of Stock":
      return "text-red bg-red/10";
    default:
      return "text-textColor-tertiary bg-textColor-tertiary/10";
  }
};

const getStatusLabel = (item) => {
  if (item.max_quantity > item.min_quantity) return "Normal";
  if (item.max_quantity > 0 && item.max_quantity <= item.min_quantity) return "Low Stock";
  return "Out of Stock";
};

export default function ProductInventoryPreview({ limit = 10 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("items")
        .select(`
          id,
          sku,
          name,
          min_quantity,
          max_quantity,
          unit_price,
          category ( name ),
          added_items!inner ( status, created_at )
        `)
        .eq("added_items.status", "Completed")
        .order("id", { ascending: true })
        .limit(limit);

      if (!error) {
        setProducts(data || []);
      } else {
        console.error(error);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [limit]);

  const emptyRows = Math.max(limit - products.length, 0);

  return (
    <div className="w-full bg-primary rounded-md px-4 py-4 text-textColor-primary font-[Poppins]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Product Inventory</h2>
        {/* Updated the href to point to the new path */}
        <a href="/inventory/ProductInventoryTBL/">
            <button class="text-btn-primary hover:text-purple-300 px-4 py-2 pr-0 text-sm sm:text-base">See All</button>
          </a>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 text-center text-sm border-b border-border_color py-2 font-medium">
        <div>SKU</div>
        <div>Name</div>
        <div>Category</div>
        <div>Created At</div>
        <div>Unit Price</div>
        <div>Status</div>
      </div>

      {/* Scrollable Table Body */}
      <div className="max-h-[300px] overflow-y-auto divide-y divide-border_color">
        {loading ? (
          // Skeleton rows
          Array.from({ length: limit }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="grid grid-cols-6 text-center text-sm py-3 animate-pulse"
            >
              {Array.from({ length: 6 }).map((__, colIdx) => (
                <div
                  key={`skeleton-cell-${idx}-${colIdx}`}
                  className="mx-auto h-4 bg-gray-700/50 rounded w-[70%]"
                />
              ))}
            </div>
          ))
        ) : products.length > 0 ? (
          products.map((item) => {
            const status = getStatusLabel(item);
            return (
              <div
                key={item.id}
                className="grid grid-cols-6 text-center text-sm py-3 cursor-pointer transition hover:bg-[var(--color-tbl-hover)]"
                onClick={() => {
                  setSelectedProduct(item);
                  setShowModal(true);
                }}
              >
                <div className="truncate px-2">{item.sku}</div>
                <div className="truncate px-2">{item.name}</div>
                <div className="truncate px-2">{item.category?.name || "—"}</div>
                <div>{item.added_items?.created_at ? new Date(item.added_items.created_at).toLocaleDateString() : "—"}</div>
                <div>₱{item.unit_price?.toLocaleString()}</div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-md font-semibold ${getStatusStyle(status)}`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-sm opacity-60">
            No products found.
          </div>
        )}

        {/* Empty placeholder rows */}
        {emptyRows > 0 &&
          Array.from({ length: emptyRows }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="grid grid-cols-6 text-center text-sm py-3 opacity-30"
            >
              <div>&nbsp;</div>
              <div>&nbsp;</div>
              <div>&nbsp;</div>
              <div>&nbsp;</div>
              <div>&nbsp;</div>
              <div>&nbsp;</div>
            </div>
          ))}
      </div>

      {/* Modal */}
      {showModal && (
        <ProductOverviewModal
          product={selectedProduct}
          onClose={() => setShowModal(false)}
          onUpdated={() => {}} // optional: refresh products if needed
        />
      )}
    </div>
  );
}
