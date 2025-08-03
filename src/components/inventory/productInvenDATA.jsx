import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function ProductInventoryPreview({ limit = 10, paginated = true }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [page, limit]);

  async function fetchProducts() {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const selectOptions = paginated ? { count: "exact" } : {};

    const { data, count, error } = await supabase
      .from("items")
      .select(
        `
        sku,
        name,
        unit_price,
        status,
        category (
          name
        ),
        auto_reorder (
          suppliers (
            name
          )
        )
      `,
        selectOptions
      )
      .order("sku", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching data:", error);
      setProducts([]);
      if (paginated) setTotal(0);
      setLoading(false);
      return;
    }

    const formatted = data.map((item) => {
      const category = item.category?.name || "Uncategorized";

      // This handles if `suppliers` is null, object, or array
      let supplier = "Pending";
      const supplierData = item.auto_reorder?.suppliers;

      if (Array.isArray(supplierData) && supplierData.length > 0) {
        supplier = supplierData[0]?.name || "Pending";
      } else if (typeof supplierData === "object" && supplierData !== null) {
        supplier = supplierData.name || "Pending";
      }

      return {
        code: item.sku,
        name: item.name,
        category,
        supplier,
        price: item.unit_price ? `₱${parseFloat(item.unit_price).toFixed(2)}` : "₱0.00",
        status: item.status || "Unknown"
      };
    });

    setProducts(formatted);
    if (paginated && typeof count === "number") setTotal(count);
    setLoading(false);
  }

  const totalPages = paginated ? Math.ceil(total / limit) : 1;

  const getStatusStyle = (status) => {
    switch (status.toUpperCase()) {
      case "OK":
        return "text-green bg-green/10";
      case "LOW":
        return "text-orange bg-orange/10";
      case "OUT OF STOCK":
        return "text-red bg-red/10";
      default:
        return "text-textColor-tertiary bg-textColor-tertiary/10";
    }
  };

  const renderPageButtons = () => {
    const buttons = [];
    const maxButtons = 3;

    buttons.push(
      <button
        key="1"
        onClick={() => setPage(1)}
        className={`px-3 py-1 rounded ${page === 1 ? "bg-purple-600 text-white" : "hover:bg-gray-200"}`}
      >
        1
      </button>
    );

    if (page > maxButtons) {
      buttons.push(<span key="dots-left" className="px-2 text-gray-500">...</span>);
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded ${page === i ? "bg-purple-600 text-white" : "hover:bg-gray-200"}`}
        >
          {i}
        </button>
      );
    }

    if (page < totalPages - maxButtons) {
      buttons.push(<span key="dots-right" className="px-2 text-gray-500">...</span>);
    }

    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setPage(totalPages)}
          className={`px-3 py-1 rounded ${page === totalPages ? "bg-purple-600 text-white" : "hover:bg-gray-200"}`}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="space-y-4">
      {/* Table Headers */}
      <div className="grid grid-cols-6 items-center border-b border-border_color pb-2 font-semibold text-sm text-textColor-primary uppercase">
        <span>Item Code</span>
        <span className="text-left">Item Name</span>
        <span className="text-left">Category</span>
        <span className="text-left">Supplier</span>
        <span className="text-left">Unit Price</span>
        <span className="text-left">Status</span>
      </div>

      {/* Table Rows */}
      {loading ? (
        <p className="text-textColor-primary">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-textColor-primary">No products found.</p>
      ) : (
        products.map((product) => (
          <a
            href={`/inventory/product/${product.code}`}
            key={product.code}
            className="grid grid-cols-6 items-center border-b border-border_color py-2 text-sm hover:bg-btn-hover rounded transition cursor-pointer"
          >
            <span>{product.code}</span>
            <span className="text-left">{product.name}</span>
            <span className="text-left">{product.category}</span>
            <span className="text-left">{product.supplier}</span>
            <span className="text-left">{product.price}</span>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full w-fit ${getStatusStyle(product.status)}`}
            >
              {product.status}
            </span>
          </a>
        ))
      )}

      {/* Pagination Footer */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
          <div>
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} products
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-30"
            >
              &lt;
            </button>

            {renderPageButtons()}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-30"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
