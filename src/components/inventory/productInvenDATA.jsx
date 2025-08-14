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

  const [categories, setCategories] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 🔹 Draft filters (for modal inputs)
  const [draftAvailability, setDraftAvailability] = useState([]);
  const [draftCategory, setDraftCategory] = useState("");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");

  // 🔹 Applied filters (actually used in query)
  const [availability, setAvailability] = useState([]);
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const totalPages = Math.ceil(total / limit);

  // 🔹 Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("category")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error) setCategories(data);
    };
    fetchCategories();
  }, []);

  async function fetchProducts() {
    setLoading(true);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("items")
      .select(
        `
        id,
        sku,
        name,
        min_quantity,
        max_quantity,
        unit_price,
        category ( name ),
        added_items!inner ( status, created_at )
      `,
        { count: "exact" }
      )
      .eq("added_items.status", "Completed")
      .eq("isDeleted", false);

    // 🔹 Apply filters
    if (availability.length > 0) query = query.in("status", availability);
    if (category) query = query.eq("category_id", category);
    if (minPrice) query = query.gte("unit_price", Number(minPrice));
    if (maxPrice) query = query.lte("unit_price", Number(maxPrice));

    const { data, count, error } = await query
      .order("id", { ascending: true })
      .range(from, to);

    if (!error) {
      setProducts(data);
      setTotal(count || 0);
    } else {
      console.error(error);
    }

    setLoading(false);
  }

  // 🔹 Only refetch when applied filters change
  useEffect(() => {
    fetchProducts();
  }, [limit, page, availability, category, minPrice, maxPrice]);

  const handleRowClick = (item) => {
    setSelectedProduct(item);
    setShowModal(true);
  };

  const getStatusLabel = (item) => {
    if (item.max_quantity > item.min_quantity) return "Normal";
    if (item.max_quantity > 0 && item.max_quantity <= item.min_quantity) return "Low Stock";
    return "Out of Stock";
  };

  const toggleDraftAvailability = (value) => {
    setDraftAvailability((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <div className="w-full bg-primary rounded-md text-textColor-primary font-[Poppins] relative">
      {/* 🔹 Hidden Filter Button (triggered from Astro parent) */}
      <button
        id="react-filter-btn"
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="hidden"
      ></button>

      {/* 🔹 Filter Panel */}
      {filtersOpen && (
        <div
          className="absolute top-12 right-4 w-72 bg-primary text-textColor-primary rounded-lg p-4 border border-border_color shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-base font-semibold mb-2">Availability:</h3>
          <div className="flex flex-col gap-1 mb-4">
            {["Normal", "Low Stock", "Out of Stock"].map((label) => (
              <label key={label}>
                <input
                  type="checkbox"
                  checked={draftAvailability.includes(label)}
                  onChange={() => toggleDraftAvailability(label)}
                  className="mr-2"
                />
                {label}
              </label>
            ))}
          </div>

          <hr className="border-border_color mb-4" />

          <h3 className="font-semibold mb-2">Category:</h3>
          <select
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
            className="w-full bg-primary border border-neutral-700 rounded px-3 py-2 mb-4"
          >
            <option value="">-- All Categories --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <hr className="border-border_color mb-4" />

          <h3 className="font-semibold mb-2">Price Range:</h3>
          <div className="flex justify-between gap-2 mb-4">
            <input
              type="number"
              placeholder="Min:"
              min="0"
              value={draftMinPrice}
              onChange={(e) =>
                setDraftMinPrice(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
              }
              className="w-1/2 bg-primary text-textColor-primary px-3 py-2 rounded border border-neutral-700"
            />
            <input
              type="number"
              placeholder="Max:"
              min="0"
              value={draftMaxPrice}
              onChange={(e) =>
                setDraftMaxPrice(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
              }
              className="w-1/2 bg-primary text-textColor-primary px-3 py-2 rounded border border-neutral-700"
            />
          </div>

          {/* Reset + Apply */}
          <div className="flex justify-between mt-2">
            <button
              onClick={() => {
                setDraftAvailability([]);
                setDraftCategory("");
                setDraftMinPrice("");
                setDraftMaxPrice("");
                setAvailability([]);
                setCategory("");
                setMinPrice("");
                setMaxPrice("");
              }}
              className="bg-primary hover:bg-btn-hover hover:text-white text-textColor-primary font-semibold px-4 py-2 rounded"
            >
              Reset
            </button>
            <button
              onClick={() => {
                setAvailability(draftAvailability);
                setCategory(draftCategory);
                setMinPrice(draftMinPrice);
                setMaxPrice(draftMaxPrice);
                setFiltersOpen(false);
                setPage(1);
              }}
              className="bg-primary hover:bg-btn-hover hover:text-white text-textColor-primary font-semibold px-4 py-2 rounded"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Table Headers */}
      <div className="grid grid-cols-6 items-center text-sm font-semibold px-3 py-3 border-b border-border_color rounded-t">
        <span>SKU</span>
        <span>Name</span>
        <span>Category</span>
        <span>Created At</span>
        <span>Unit Price</span>
        <span className="text-center">Status</span>
      </div>

      {/* 🔹 Table Rows */}
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
              className="grid grid-cols-6 items-center border-b px-3 py-3 text-sm cursor-pointer hover:bg-[var(--color-tbl-hover)]"
              onClick={() => handleRowClick(item)}
            >
              <span>{item.sku}</span>
              <span>{item.name}</span>
              <span>{item.category?.name || "—"}</span>
              <span>
                {item.added_items?.created_at
                  ? new Date(item.added_items.created_at).toLocaleDateString()
                  : "—"}
              </span>
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

      {/* 🔹 Pagination Footer */}
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
            {!hidePageNumbers &&
              Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-2 py-1 rounded ${
                    page === i + 1 ? "bg-[var(--color-tbl-hover)] font-bold" : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}
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

      {/* 🔹 Product Overview Modal */}
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
