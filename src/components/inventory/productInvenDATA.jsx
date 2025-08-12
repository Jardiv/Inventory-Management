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

export default function ProductInventoryPreview({ limit = 10, hidePageNumbers = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [paginated, setPaginated] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const totalPages = Math.ceil(total / limit);

  async function fetchProducts() {
  setLoading(true);

  // Count active products (not deleted)
  const { count } = await supabase
    .from("items")
    .select("id, added_items!inner(status)", { count: "exact", head: true })
    .eq("added_items.status", "Completed")
    .eq("isDeleted", false); // ✅ hide deleted from active count

  setTotal(count || 0);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Get active products only
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
    .eq("isDeleted", false) // ✅ hide deleted from table
    .order("id", { ascending: true })
    .range(from, to);

  if (!error) {
    setProducts(data);
  } else {
    console.error(error);
  }

  setLoading(false);
}

  useEffect(() => {
    fetchProducts();
  }, [limit, page]);

  const handleRowClick = (item) => {
    setSelectedProduct(item);
    setShowModal(true);
  };

  const renderPageButtons = () => {
    const buttons = [];
    buttons.push(
      <button
        key={1}
        onClick={() => setPage(1)}
        className={`px-2 py-1 rounded hover:bg-[var(--color-tbl-hover)] ${page === 1 ? "bg-[var(--color-tbl-hover)] font-bold" : ""}`}
      >
        1
      </button>
    );
    if (page > 3) buttons.push(<span key="start-ellipsis">...</span>);
    if (page > 1 && page < totalPages) {
      buttons.push(
        <button key={page} onClick={() => setPage(page)} className="px-2 py-1 rounded bg-[var(--color-tbl-hover)] font-bold">
          {page}
        </button>
      );
    }
    if (page < totalPages - 2) buttons.push(<span key="end-ellipsis">...</span>);
    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setPage(totalPages)}
          className={`px-2 py-1 rounded hover:bg-[var(--color-tbl-hover)] ${page === totalPages ? "bg-[var(--color-tbl-hover)] font-bold" : ""}`}
        >
          {totalPages}
        </button>
      );
    }
    return buttons;
  };

  const getStatusLabel = (item) => {
    if (item.max_quantity > item.min_quantity) return "Normal";
    if (item.max_quantity > 0 && item.max_quantity <= item.min_quantity) return "Low Stock";
    return "Out of Stock";
  };

  return (
    <div className="w-full bg-primary rounded-md text-textColor-primary font-[Poppins]">
      {/* Table Headers */}
      <div className="grid grid-cols-6 items-center text-sm font-semibold px-3 py-3 border-b border-border_color rounded-t">
        <span>SKU</span>
        <span>Name</span>
        <span>Category</span>
        <span>Created At</span>
        <span>Unit Price</span>
        <span className="text-center">Status</span>
      </div>

      {/* Table Rows */}
      {loading ? (
        <p className="px-3 py-4">Loading...</p>
      ) : products.length === 0 ? (
        <p className="px-3 py-4">No products found.</p>
      ) : (
        products.map((item) => {
          const status = getStatusLabel(item);
          return (
            <div
              key={item.id}
              className="grid grid-cols-6 items-center border-b px-3 py-3 text-sm cursor-pointer transition hover:bg-[var(--color-tbl-hover)]"
              onClick={() => handleRowClick(item)}
            >
              <span>{item.sku}</span>
              <span>{item.name}</span>
              <span>{item.category?.name || "—"}</span>
              <span>{item.added_items?.created_at ? new Date(item.added_items.created_at).toLocaleDateString() : "—"}</span>
              <span>₱{item.unit_price?.toLocaleString()}</span>
              <span
                className={`flex justify-center items-center px-4 py-1 rounded-md text-sm font-semibold ${getStatusStyle(
                  status
                )}`}
              >
                {status}
              </span>
            </div>
          );
        })
      )}

      {/* Pagination Footer */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-3 text-sm">
          <div>
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} items
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded"
            >
              &lt;
            </button>
            {!hidePageNumbers && renderPageButtons()}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Product Overview Modal */}
      {showModal && (
        <ProductOverviewModal
          product={selectedProduct}
          onClose={() => setShowModal(false)}
          onUpdated={fetchProducts}
        />
      )}
    </div>
  );
}
