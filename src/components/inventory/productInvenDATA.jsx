import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function PendingItemsPreview({ limit = 10, paginated = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("order"); // default sorting by order (id ascending)

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // 🔹 Fetch from items table and join with added_items to get the original status
      let query = supabase
        .from("items")
        .select(`
          id,
          name,
          sku,
          description,
          created_at,
          isDeleted,
          added_items!inner(status, created_at)
        `, { count: "exact" });

      // 🔹 Apply status filter
      if (statusFilter === "Deleted") {
        query = query.eq("isDeleted", true);
      } else if (statusFilter === "Pending") {
        query = query.eq("isDeleted", false).eq("added_items.status", "Pending");
      } else if (statusFilter === "Canceled") {
        query = query.eq("isDeleted", false).eq("added_items.status", "Canceled");
      } else if (statusFilter === "All") {
        // For "All", we want items that are either:
        // 1. Deleted (isDeleted = true) OR
        // 2. Not deleted but have Pending/Canceled status
        query = query.or("isDeleted.eq.true,and(isDeleted.eq.false,added_items.status.in.(Pending,Canceled))");
      }

      // 🔹 Apply sorting
      if (sortBy === "recently_added") {
        query = query.order("id", { ascending: false }); // Newest first by ID
      } else if (sortBy === "order") {
        query = query.order("id", { ascending: true }); // Oldest first by ID
      }

      // 🔹 Apply pagination if enabled
      if (paginated) {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error("Error fetching items:", error.message);
        setItems([]);
        setTotal(0);
      } else {
        // 🔹 Map the data to include the correct status
        const processedItems = (data || []).map(item => ({
          ...item,
          status: item.isDeleted ? "Deleted" : item.added_items?.status || "Unknown",
          // Use added_items created_at for consistency, fallback to items created_at
          created_at: item.added_items?.created_at || item.created_at
        }));

        setItems(processedItems);
        setTotal(count || 0);
      }
      setLoading(false);
    }

    fetchItems();
  }, [page, statusFilter, sortBy, limit, paginated]);

  const totalPages = Math.ceil(total / limit);

  const renderPageButtons = () => {
    const buttons = [];
    buttons.push(
      <button
        key={1}
        onClick={() => setPage(1)}
        className={`px-2 py-1 rounded transition-colors duration-200 ${
          page === 1
            ? "font-bold text-white"
            : "hover:bg-[var(--color-btn-hover)]"
        }`}
        style={{
          backgroundColor:
            page === 1 ? "var(--color-btn-hover)" : "transparent",
        }}
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
          className={`px-2 py-1 rounded transition-colors duration-200 ${
            page === page
              ? "font-bold text-white"
              : "hover:bg-[var(--color-btn-hover)]"
          }`}
          style={{
            backgroundColor:
              page === page ? "var(--color-btn-hover)" : "transparent",
          }}
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
          className={`px-2 py-1 rounded transition-colors duration-200 ${
            page === totalPages
              ? "font-bold text-white"
              : "hover:bg-[var(--color-btn-hover)]"
          }`}
          style={{
            backgroundColor:
              page === totalPages ? "var(--color-btn-hover)" : "transparent",
          }}
        >
          {totalPages}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div>
      {/* Header: Title + Filters + Back Button */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Pending Products</h2>

          {/* Status Filter */}
          <select
            className="p-2 rounded border text-textColor-primary"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            aria-label="Filter by status"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Canceled">Canceled</option>
            <option value="Deleted">Deleted</option>
          </select>

          {/* Sort By Filter */}
          <select
            className="p-2 rounded border text-textColor-primary"
            value={sortBy}
            onChange={(e) => {
              setPage(1);
              setSortBy(e.target.value);
            }}
            aria-label="Sort items"
          >
            <option value="order">Sort by Order (ID Asc)</option>
            <option value="recently_added">Sort by Recently Added</option>
          </select>
        </div>

        <button
          onClick={() => window.history.back()}
          className="p-2 text-textColor-primary hover:bg-btn-hover hover:text-white rounded"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-6">Loading...</div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="border rounded p-4 bg-primary shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">ID: {item.id}</span>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    item.status === "Pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : item.status === "Deleted"
                      ? "bg-gray-200 text-gray-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="text-lg font-bold">{item.name}</div>
              <div className="text-sm">SKU: {item.sku}</div>
              <p className="mt-2 text-sm">{item.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-6">No {statusFilter.toLowerCase()} items found.</div>
        )}
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div>
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} items
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
              &lt;
            </button>
            {renderPageButtons()}
            <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}