import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import ProductOverviewModal from "./ProductOverviewModal.jsx"; // 👈 Updated import

export default function ProductInventoryPreview({ limit = 10, hidePageNumbers = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [paginated, setPaginated] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);

      const { count } = await supabase
        .from("items")
        .select("id, added_items!inner(status)", { count: "exact", head: true })
        .eq("added_items.status", "Completed");

      setTotal(count || 0);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from("items")
        .select(`
          id,
          sku,
          name,
          unit_price,
          min_quantity,
          max_quantity,
          category ( name ),
          added_items!inner ( status, created_at )
        `)
        .eq("added_items.status", "Completed")
        .order("id", { ascending: true })
        .range(from, to);

      if (!error) {
        setProducts(data);
      } else {
        console.error(error);
      }

      setLoading(false);
    }

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
        className={`px-2 py-1 rounded hover:bg-primary ${page === 1 ? "bg-primary font-bold" : ""}`}
      >
        1
      </button>
    );
    if (page > 3) buttons.push(<span key="start-ellipsis">...</span>);
    if (page > 1 && page < totalPages) {
      buttons.push(
        <button
          key={page}
          onClick={() => setPage(page)}
          className="px-2 py-1 rounded bg-gray-300 font-bold"
        >
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
          className={`px-2 py-1 rounded hover:bg-gray-200 ${page === totalPages ? "bg-gray-300 font-bold" : ""}`}
        >
          {totalPages}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div>
      {/* Table Headers */}
      <div className="grid grid-cols-8 items-center bg-primary text-sm font-semibold px-3 py-3 border-b border-border_color rounded-t text-texctColor-primary">
        <span>SKU</span>
        <span>Name</span>
        <span>Category</span>
        <span>Status</span>
        <span>Min Qty</span>
        <span>Max Qty</span>
        <span>Unit Price</span>
        <span>Created At</span>
      </div>

      {/* Table Rows */}
      {loading ? (
        <p className="px-3 py-4">Loading...</p>
      ) : products.length === 0 ? (
        <p className="px-3 py-4">No products found.</p>
      ) : (
        products.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-8 items-center border-b px-3 py-3 text-sm hover:bg-btn-hover rounded transition cursor-pointer"
            onClick={() => handleRowClick(item)}
          >
            <span>{item.sku}</span>
            <span>{item.name}</span>
            <span>{item.category?.name || "—"}</span>
            <span>{item.added_items?.status || "—"}</span>
            <span>{item.min_quantity}</span>
            <span>{item.max_quantity}</span>
            <span>₱{item.unit_price?.toFixed(2)}</span>
            <span>{item.added_items?.created_at ? new Date(item.added_items.created_at).toLocaleDateString() : "—"}</span>
          </div>
        ))
      )}

      {/* Pagination Footer */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div>
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} items
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>&lt;</button>
            {!hidePageNumbers && renderPageButtons()}
            <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>&gt;</button>
          </div>
        </div>
      )}

      {/* Product Overview Modal */}
      {showModal && (
        <ProductOverviewModal
          product={selectedProduct}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
